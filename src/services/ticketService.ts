// src/services/ticketService.ts
import { supabase } from '../lib/supabase';
import { createComment } from './commentService';
import type { Ticket, CreateTicketDTO, UpdateTicketDTO, CloseTicketDTO } from '../types/ticket';

export async function getTickets(userId: string, userRole?: string): Promise<Ticket[]> {
  let query = supabase
    .from('tickets')
    .select(`
      *,
      creator:users!tickets_created_by_fkey(id, full_name, email),
      assignee:users!tickets_assigned_to_fkey(id, full_name, email)
    `);

  // Si NO es admin, filtrar por sus tickets
  if (userRole !== 'admin') {
    query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
  }

  const { data: tickets, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(`Error al obtener tickets: ${error.message}`);
  return tickets || [];
}

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
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error al obtener ticket: ${error.message}`);
  }

  return ticket;
}

export async function updateTicket(
  id: string,
  data: UpdateTicketDTO
): Promise<Ticket> {
  const updateData: any = { ...data };

  if (data.status === 'resolved' && !data.hasOwnProperty('resolved_at')) {
    updateData.resolved_at = new Date().toISOString();
  }

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

export async function closeTicket(
  ticketId: string,
  userId: string,
  data: CloseTicketDTO
): Promise<Ticket> {
  await createComment(ticketId, userId, {
    content: data.closing_comment,
    is_internal: data.is_internal || false,
  });

  const ticket = await updateTicket(ticketId, {
    status: 'closed',
  });

  return ticket;
}

export function formatWhatsAppPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const formatted = cleaned.startsWith('521') ? cleaned : `521${cleaned}`;
  return `${formatted}@s.whatsapp.net`;
}