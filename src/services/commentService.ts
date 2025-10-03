// src/services/commentService.ts
import { supabase } from '../lib/supabase';
import type { TicketComment, CreateCommentDTO } from '../types/ticket';

export async function createComment(
  ticketId: string,
  userId: string,
  data: CreateCommentDTO
): Promise<TicketComment> {
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

  return comment;
}

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

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('ticket_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw new Error(`Error al eliminar comentario: ${error.message}`);
}