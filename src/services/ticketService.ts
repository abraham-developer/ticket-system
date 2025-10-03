import { supabase } from '../lib/supabase';
import type { Ticket, CreateTicketDTO, UpdateTicketDTO } from '../types/ticket';

export async function createTicket(
  data: CreateTicketDTO,
  userId: string
): Promise<Ticket> {
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      ...data,
      created_by: userId,
      status: 'new',
    })
    .select(`
      *,
      creator:users!tickets_created_by_fkey(id, full_name, email),
      assignee:users!tickets_assigned_to_fkey(id, full_name, email)
    `)
    .single();

  if (error) throw new Error(`Error al crear ticket: ${error.message}`);
  if (!ticket) throw new Error('No se pudo crear el ticket');

  return ticket;
}

export async function getTickets(userId: string): Promise<Ticket[]> {
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(`
      *,
      creator:users!tickets_created_by_fkey(id, full_name, email),
      assignee:users!tickets_assigned_to_fkey(id, full_name, email)
    `)
    .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al obtener tickets: ${error.message}`);
  return tickets || [];
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      creator:users!tickets_created_by_fkey(id, full_name, email),
      assignee:users!tickets_assigned_to_fkey(id, full_name, email)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw new Error(`Error al obtener ticket: ${error.message}`);
  }

  return ticket;
}

export async function updateTicket(
  id: string,
  data: UpdateTicketDTO
): Promise<Ticket> {
  const updateData: any = { ...data };

  // Si se cambia a resolved, guardar fecha
  if (data.status === 'resolved' && !data.hasOwnProperty('resolved_at')) {
    updateData.resolved_at = new Date().toISOString();
  }

  // Si se cambia a closed, guardar fecha
  if (data.status === 'closed' && !data.hasOwnProperty('closed_at')) {
    updateData.closed_at = new Date().toISOString();
  }

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

  return ticket;
}

export async function deleteTicket(id: string): Promise<void> {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error al eliminar ticket: ${error.message}`);
}

export async function assignTicket(
  ticketId: string,
  agentId: string
): Promise<Ticket> {
  return updateTicket(ticketId, { assigned_to: agentId });
}

// Utilidad para formatear teléfono de WhatsApp
export function formatWhatsAppPhone(phone: string): string {
  // Eliminar caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Si no empieza con 521, agregarlo (México)
  const formatted = cleaned.startsWith('521') ? cleaned : `521${cleaned}`;
  
  return `${formatted}@s.whatsapp.net`;
}