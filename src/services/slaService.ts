// src/services/slaService.ts
import { supabase } from '../lib/supabase';
import type { SLAConfiguration, SLAHistory, TicketAlert, SLAMetrics } from '../types/ticket';

/**
 * Obtener configuraciones de SLA
 */
export async function getSLAConfigurations(): Promise<SLAConfiguration[]> {
  const { data, error } = await supabase
    .from('sla_configurations')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error) throw new Error(`Error al obtener configuraciones SLA: ${error.message}`);
  return data || [];
}

/**
 * Crear o actualizar configuración de SLA
 */
export async function upsertSLAConfiguration(config: Partial<SLAConfiguration>): Promise<SLAConfiguration> {
  const { data, error } = await supabase
    .from('sla_configurations')
    .upsert(config)
    .select()
    .single();

  if (error) throw new Error(`Error al guardar configuración SLA: ${error.message}`);
  return data;
}

/**
 * Obtener historial de SLA de un ticket
 */
export async function getTicketSLAHistory(ticketId: string): Promise<SLAHistory[]> {
  const { data, error } = await supabase
    .from('sla_history')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Error al obtener historial SLA: ${error.message}`);
  return data || [];
}

/**
 * Obtener tickets que requieren alertas
 */
export async function getTicketsRequiringAlert(): Promise<TicketAlert[]> {
  const { data, error } = await supabase.rpc('get_tickets_requiring_alert');

  if (error) throw new Error(`Error al obtener tickets con alerta: ${error.message}`);
  return data || [];
}

/**
 * Marcar ticket como notificado por breach de SLA
 */
export async function markTicketAsNotified(ticketId: string): Promise<void> {
  const { error } = await supabase
    .from('tickets')
    .update({ sla_breach_notified: true })
    .eq('id', ticketId);

  if (error) throw new Error(`Error al marcar ticket como notificado: ${error.message}`);
}

/**
 * Calcular métricas de SLA
 */
export async function calculateSLAMetrics(
  startDate?: string,
  endDate?: string
): Promise<SLAMetrics> {
  let query = supabase
    .from('tickets')
    .select('*');

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: tickets, error } = await query;

  if (error) throw new Error(`Error al calcular métricas SLA: ${error.message}`);

  const total = tickets?.length || 0;
  const responseMet = tickets?.filter(t => t.response_sla_met === true).length || 0;
  const responseBreached = tickets?.filter(t => t.response_sla_met === false).length || 0;
  const resolutionMet = tickets?.filter(t => t.resolution_sla_met === true).length || 0;
  const resolutionBreached = tickets?.filter(t => t.resolution_sla_met === false).length || 0;

  // Calcular promedios de tiempo
  const avgResponseTime = tickets
    ?.filter(t => t.first_response_at)
    .reduce((acc, t) => {
      const hours = (new Date(t.first_response_at!).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60);
      return acc + hours;
    }, 0) / tickets?.filter(t => t.first_response_at).length || 0;

  const avgResolutionTime = tickets
    ?.filter(t => t.resolved_at)
    .reduce((acc, t) => {
      const hours = (new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60);
      return acc + hours;
    }, 0) / tickets?.filter(t => t.resolved_at).length || 0;

  // Calcular tickets en riesgo (80% del tiempo SLA consumido)
  const now = new Date();
  const ticketsAtRisk = tickets?.filter(t => {
    if (t.status === 'closed' || t.status === 'resolved') return false;
    
    const hoursElapsed = (now.getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60);
    const slaThreshold = t.sla_resolution_time_hours || 72;
    
    return hoursElapsed >= (slaThreshold * 0.8);
  }).length || 0;

  return {
    total_tickets: total,
    response_sla_met: responseMet,
    response_sla_breached: responseBreached,
    resolution_sla_met: resolutionMet,
    resolution_sla_breached: resolutionBreached,
    avg_response_time_hours: Math.round(avgResponseTime * 100) / 100,
    avg_resolution_time_hours: Math.round(avgResolutionTime * 100) / 100,
    tickets_at_risk: ticketsAtRisk,
  };
}

/**
 * Obtener tickets desde la vista con información de SLA
 */
export async function getTicketsWithSLA(userId: string, userRole?: string) {
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

  if (error) {
    console.error('Error en getTicketsWithSLA:', error);
    throw new Error(`Error al obtener tickets con SLA: ${error.message}`);
  }

  return tickets || [];
}

/**
 * Registrar primera respuesta en un ticket
 */
export async function recordFirstResponse(ticketId: string): Promise<void> {
  // Verificar si ya tiene primera respuesta
  const { data: ticket } = await supabase
    .from('tickets')
    .select('first_response_at')
    .eq('id', ticketId)
    .single();

  if (ticket?.first_response_at) {
    return; // Ya tiene primera respuesta
  }

  const { error } = await supabase
    .from('tickets')
    .update({ first_response_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (error) throw new Error(`Error al registrar primera respuesta: ${error.message}`);
}