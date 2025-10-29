// src/services/ticketService.ts - VERSIÓN ACTUALIZADA
import { supabase } from '../lib/supabase';
import { createComment } from './commentService';
import { autoAssignTicket } from './assignmentService';
import { notifyTicketCreated, notifyStatusChange, notifyAssignment } from './notificationService';
import { recordFirstResponse } from './slaService';
import type { Ticket, CreateTicketDTO, UpdateTicketDTO, CloseTicketDTO } from '../types/ticket';

/**
 * Obtener tickets (usando la vista con SLA)
 */
export async function getTickets(userId: string, userRole?: string): Promise<Ticket[]> {
  let query = supabase
    .from('tickets_with_sla')
    .select(`
      *,
      creator:created_by(id, full_name, email),
      assignee:assigned_to(id, full_name, email)
    `);

  // Si NO es admin, filtrar por sus tickets
  if (userRole !== 'admin') {
    query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
  }

  const { data: tickets, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(`Error al obtener tickets: ${error.message}`);
  return tickets || [];
}

/**
 * Crear ticket con asignación automática
 */
export async function createTicket(
  data: CreateTicketDTO,
  userId: string
): Promise<Ticket> {
  try {
    // 1. Intentar asignación automática
    const assignedTo = await autoAssignTicket(data);
    
    console.log('🎯 Asignación automática:', assignedTo ? `Usuario ${assignedTo}` : 'Sin asignar');

    // 2. Crear el ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        ...data,
        created_by: userId,
        assigned_to: assignedTo,
        status: 'new',
        auto_assigned: !!assignedTo,
      })
      .select(`
        *,
        creator:users!tickets_created_by_fkey(id, full_name, email),
        assignee:users!tickets_assigned_to_fkey(id, full_name, email)
      `)
      .single();

    if (error) throw new Error(`Error al crear ticket: ${error.message}`);
    if (!ticket) throw new Error('No se pudo crear el ticket');

    // 3. Enviar notificaciones
    await notifyTicketCreated(ticket);

    console.log(`✅ Ticket creado: #${ticket.ticket_number}`);
    
    return ticket;
  } catch (error: any) {
    console.error('❌ Error en createTicket:', error);
    throw error;
  }
}

/**
 * Obtener ticket por ID
 */
export async function getTicketById(id: string): Promise<Ticket | null> {
  const { data: ticket, error } = await supabase
    .from('tickets_with_sla')
    .select(`
      *,
      creator:created_by(id, full_name, email),
      assignee:assigned_to(id, full_name, email)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error al obtener ticket: ${error.message}`);
  }

  return ticket;
}

/**
 * Actualizar ticket
 */
export async function updateTicket(
  id: string,
  data: UpdateTicketDTO
): Promise<Ticket> {
  // Obtener estado anterior para notificaciones
  const { data: oldTicket } = await supabase
    .from('tickets')
    .select('status, assigned_to')
    .eq('id', id)
    .single();

  const updateData: any = { ...data };

  // Auto-timestamps para cambios de estado
  if (data.status === 'resolved' && !data.hasOwnProperty('resolved_at')) {
    updateData.resolved_at = new Date().toISOString();
  }

  if (data.status === 'closed' && !data.hasOwnProperty('closed_at')) {
    updateData.closed_at = new Date().toISOString();
  }

  // Actualizar ticket
  const { data: ticket, error } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      creator:users!tickets_created_by_fkey(id, full_name, email),
      assignee:users!tickets_assigned_to_fkey(id, full_name, email)
    `)
    .single();

  if (error) throw new Error(`Error al actualizar ticket: ${error.message}`);
  if (!ticket) throw new Error('No se pudo actualizar el ticket');

  // Notificaciones
  if (oldTicket) {
    // Cambio de estado
    if (data.status && data.status !== oldTicket.status) {
      await notifyStatusChange(ticket, oldTicket.status, data.status);
    }

    // Nueva asignación
    if (data.assigned_to && data.assigned_to !== oldTicket.assigned_to) {
      await notifyAssignment(ticket, data.assigned_to);
    }
  }

  return ticket;
}

/**
 * Eliminar ticket
 */
export async function deleteTicket(id: string): Promise<void> {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error al eliminar ticket: ${error.message}`);
}

/**
 * Asignar ticket a un agente
 */
export async function assignTicket(
  ticketId: string,
  agentId: string
): Promise<Ticket> {
  return updateTicket(ticketId, { assigned_to: agentId });
}

/**
 * Cerrar ticket con comentario
 */
export async function closeTicket(
  ticketId: string,
  userId: string,
  data: CloseTicketDTO
): Promise<Ticket> {
  // Agregar comentario de cierre
  await createComment(ticketId, userId, {
    content: data.closing_comment,
    is_internal: data.is_internal || false,
  });

  // Actualizar estado
  const ticket = await updateTicket(ticketId, {
    status: 'closed',
  });

  return ticket;
}

/**
 * Registrar primera respuesta a un ticket
 */
export async function markFirstResponse(
  ticketId: string
): Promise<void> {
  await recordFirstResponse(ticketId);
  
  // Cambiar estado a in_progress si está en new
  const { data: ticket } = await supabase
    .from('tickets')
    .select('status')
    .eq('id', ticketId)
    .single();

  if (ticket?.status === 'new') {
    await updateTicket(ticketId, { status: 'in_progress' });
  }
}

/**
 * Formatear número de teléfono de WhatsApp
 */
export function formatWhatsAppPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const formatted = cleaned.startsWith('521') ? cleaned : `521${cleaned}`;
  return `${formatted}@s.whatsapp.net`;
}

/**
 * Obtener estadísticas de tickets
 */
export async function getTicketStats(userId: string, userRole?: string) {
  let query = supabase.from('tickets').select('status, priority, sla_status');

  if (userRole !== 'admin') {
    query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
  }

  const { data: tickets, error } = await query;

  if (error) throw new Error(`Error al obtener estadísticas: ${error.message}`);

  const stats = {
    total: tickets?.length || 0,
    byStatus: {
      new: tickets?.filter(t => t.status === 'new').length || 0,
      in_progress: tickets?.filter(t => t.status === 'in_progress').length || 0,
      resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
      closed: tickets?.filter(t => t.status === 'closed').length || 0,
    },
    byPriority: {
      urgent: tickets?.filter(t => t.priority === 'urgent').length || 0,
      high: tickets?.filter(t => t.priority === 'high').length || 0,
      medium: tickets?.filter(t => t.priority === 'medium').length || 0,
      low: tickets?.filter(t => t.priority === 'low').length || 0,
    },
    slaRisk: tickets?.filter(t => 
      t.sla_status && ['response_warning', 'resolution_warning', 'response_breached', 'resolution_breached'].includes(t.sla_status)
    ).length || 0,
  };

  return stats;
}