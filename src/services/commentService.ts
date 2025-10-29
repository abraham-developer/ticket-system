// src/services/commentService.ts - VERSIÓN ACTUALIZADA
import { supabase } from '../lib/supabase';
import { markFirstResponse } from './ticketService';
import { notifyNewComment } from './notificationService';
import type { TicketComment, CreateCommentDTO } from '../types/ticket';

/**
 * Crear comentario y registrar primera respuesta
 */
export async function createComment(
  ticketId: string,
  userId: string,
  data: CreateCommentDTO
): Promise<TicketComment> {
  // Verificar si el ticket tiene primera respuesta
  const { data: ticket } = await supabase
    .from('tickets')
    .select('first_response_at, created_by, assigned_to, ticket_number')
    .eq('id', ticketId)
    .single();

  // Crear el comentario
  const { data: comment, error } = await supabase
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      user_id: userId,
      content: data.content,
      is_internal: data.is_internal || false,
    })
    .select(`
      *,
      user:users(id, full_name, email, avatar_url)
    `)
    .single();

  if (error) throw new Error(`Error al crear comentario: ${error.message}`);
  if (!comment) throw new Error('No se pudo crear el comentario');

  // Si no tiene primera respuesta y el comentario es del agente (no del creador), registrarla
  if (ticket && !ticket.first_response_at && userId !== ticket.created_by) {
    await markFirstResponse(ticketId);
    console.log(`✅ Primera respuesta registrada en ticket #${ticket.ticket_number}`);
  }

  // Notificar a las partes interesadas
  if (ticket) {
    // Notificar al creador si el comentario no es de él
    if (ticket.created_by && ticket.created_by !== userId) {
      await notifyNewComment(
        ticketId,
        ticket.ticket_number || '',
        userId,
        comment.user?.full_name || 'Usuario',
        data.is_internal || false,
        ticket.created_by
      );
    }

    // Notificar al asignado si existe y no es el autor del comentario
    if (ticket.assigned_to && ticket.assigned_to !== userId && ticket.assigned_to !== ticket.created_by) {
      await notifyNewComment(
        ticketId,
        ticket.ticket_number || '',
        userId,
        comment.user?.full_name || 'Usuario',
        data.is_internal || false,
        ticket.assigned_to
      );
    }
  }

  return comment;
}

/**
 * Obtener comentarios de un ticket
 */
export async function getTicketComments(ticketId: string): Promise<TicketComment[]> {
  const { data: comments, error } = await supabase
    .from('ticket_comments')
    .select(`
      *,
      user:users(id, full_name, email, avatar_url)
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Error al obtener comentarios: ${error.message}`);
  return comments || [];
}

/**
 * Actualizar comentario
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<TicketComment> {
  const { data: comment, error } = await supabase
    .from('ticket_comments')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .select(`
      *,
      user:users(id, full_name, email, avatar_url)
    `)
    .single();

  if (error) throw new Error(`Error al actualizar comentario: ${error.message}`);
  if (!comment) throw new Error('No se pudo actualizar el comentario');

  return comment;
}

/**
 * Eliminar comentario
 */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('ticket_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw new Error(`Error al eliminar comentario: ${error.message}`);
}