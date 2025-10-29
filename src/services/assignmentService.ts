// src/services/assignmentService.ts
import { supabase } from '../lib/supabase';
import type { AssignmentRule, CreateTicketDTO } from '../types/ticket';

/**
 * Obtener reglas de asignación activas
 */
export async function getAssignmentRules(): Promise<AssignmentRule[]> {
  const { data, error } = await supabase
    .from('assignment_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error) throw new Error(`Error al obtener reglas de asignación: ${error.message}`);
  return data || [];
}

/**
 * Evaluar si un ticket cumple con las condiciones de una regla
 */
function evaluateRule(ticket: Partial<CreateTicketDTO>, rule: AssignmentRule): boolean {
  const conditions = rule.conditions;

  for (const [key, value] of Object.entries(conditions)) {
    if (Array.isArray(value)) {
      // Si es un array, verificar si el valor del ticket está incluido
      if (!value.includes((ticket as any)[key])) {
        return false;
      }
    } else {
      // Comparación directa
      if ((ticket as any)[key] !== value) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Encontrar el agente más adecuado para asignar
 */
export async function findBestAgent(
  role?: string,
  category?: string
): Promise<string | null> {
  let query = supabase
    .from('users')
    .select('id, role')
    .eq('is_active', true);

  if (role) {
    query = query.eq('role', role);
  } else {
    // Por defecto, buscar agentes
    query = query.in('role', ['agent', 'admin']);
  }

  const { data: users, error } = await query;

  if (error || !users || users.length === 0) {
    return null;
  }

  // Obtener carga de trabajo de cada usuario (tickets activos)
  const userLoads = await Promise.all(
    users.map(async (user) => {
      const { count } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .in('status', ['new', 'in_progress']);

      return {
        userId: user.id,
        load: count || 0,
      };
    })
  );

  // Ordenar por carga (menos tickets = mayor prioridad)
  userLoads.sort((a, b) => a.load - b.load);

  return userLoads[0]?.userId || null;
}

/**
 * Asignar automáticamente un ticket según las reglas
 */
export async function autoAssignTicket(
  ticket: Partial<CreateTicketDTO>
): Promise<string | null> {
  const rules = await getAssignmentRules();

  // Evaluar cada regla en orden de prioridad
  for (const rule of rules) {
    if (evaluateRule(ticket, rule)) {
      console.log('✅ Regla coincidente:', rule.name);

      // Si la regla especifica un usuario específico
      if (rule.assign_to_user_id) {
        return rule.assign_to_user_id;
      }

      // Si la regla especifica un rol
      if (rule.assign_to_role) {
        const agentId = await findBestAgent(rule.assign_to_role, ticket.category);
        if (agentId) {
          return agentId;
        }
      }
    }
  }

  // Si no hay regla que coincida, asignar al agente con menos carga
  console.log('⚠️ No hay regla específica, asignando por carga de trabajo');
  return await findBestAgent(undefined, ticket.category);
}

/**
 * Crear regla de asignación
 */
export async function createAssignmentRule(
  rule: Omit<AssignmentRule, 'id' | 'created_at' | 'updated_at'>
): Promise<AssignmentRule> {
  const { data, error } = await supabase
    .from('assignment_rules')
    .insert(rule)
    .select()
    .single();

  if (error) throw new Error(`Error al crear regla de asignación: ${error.message}`);
  return data;
}

/**
 * Actualizar regla de asignación
 */
export async function updateAssignmentRule(
  id: string,
  updates: Partial<AssignmentRule>
): Promise<AssignmentRule> {
  const { data, error } = await supabase
    .from('assignment_rules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar regla de asignación: ${error.message}`);
  return data;
}

/**
 * Eliminar regla de asignación
 */
export async function deleteAssignmentRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('assignment_rules')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error al eliminar regla de asignación: ${error.message}`);
}

/**
 * Reasignar tickets de un usuario a otro
 */
export async function reassignUserTickets(
  fromUserId: string,
  toUserId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('tickets')
    .update({ assigned_to: toUserId })
    .eq('assigned_to', fromUserId)
    .in('status', ['new', 'in_progress'])
    .select('id');

  if (error) throw new Error(`Error al reasignar tickets: ${error.message}`);
  return data?.length || 0;
}

/**
 * Balancear carga de trabajo entre agentes
 */
export async function balanceWorkload(): Promise<void> {
  // Obtener todos los agentes activos
  const { data: agents, error: agentsError } = await supabase
    .from('users')
    .select('id')
    .in('role', ['agent', 'admin'])
    .eq('is_active', true);

  if (agentsError || !agents || agents.length === 0) {
    console.log('No hay agentes disponibles para balanceo');
    return;
  }

  // Obtener carga de cada agente
  const agentLoads = await Promise.all(
    agents.map(async (agent) => {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, priority')
        .eq('assigned_to', agent.id)
        .in('status', ['new', 'in_progress']);

      const load = tickets?.length || 0;
      const urgentCount = tickets?.filter(t => t.priority === 'urgent').length || 0;

      return {
        agentId: agent.id,
        load,
        urgentCount,
      };
    })
  );

  // Ordenar por carga
  agentLoads.sort((a, b) => a.load - b.load);

  const minLoad = agentLoads[0].load;
  const maxLoad = agentLoads[agentLoads.length - 1].load;

  // Si la diferencia es mayor a 5 tickets, balancear
  if (maxLoad - minLoad > 5) {
    const overloadedAgent = agentLoads[agentLoads.length - 1];
    const underloadedAgent = agentLoads[0];

    const ticketsToMove = Math.floor((overloadedAgent.load - underloadedAgent.load) / 2);

    // Obtener tickets no urgentes del agente sobrecargado
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id')
      .eq('assigned_to', overloadedAgent.agentId)
      .in('status', ['new', 'in_progress'])
      .neq('priority', 'urgent')
      .limit(ticketsToMove);

    if (tickets && tickets.length > 0) {
      const ticketIds = tickets.map(t => t.id);

      await supabase
        .from('tickets')
        .update({ assigned_to: underloadedAgent.agentId })
        .in('id', ticketIds);

      console.log(`✅ Balanceado ${ticketIds.length} tickets de ${overloadedAgent.agentId} a ${underloadedAgent.agentId}`);
    }
  }
}