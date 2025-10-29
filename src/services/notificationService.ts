// src/services/notificationService.ts
import { supabase } from '../lib/supabase';
import type { Notification, NotificationChannel, Ticket } from '../types/ticket';

/**
 * Crear una notificación
 */
export async function createNotification(
  ticketId: string,
  userId: string,
  channel: NotificationChannel,
  type: string,
  message: string,
  subject?: string,
  metadata?: Record<string, any>
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ticket_id: ticketId,
      user_id: userId,
      channel,
      type,
      message,
      subject,
      metadata,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(`Error al crear notificación: ${error.message}`);
  return data;
}

/**
 * Obtener notificaciones de un usuario
 */
export async function getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, ticket:tickets(ticket_number, title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Error al obtener notificaciones: ${error.message}`);
  return data || [];
}

/**
 * Marcar notificación como enviada
 */
export async function markNotificationAsSent(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) throw new Error(`Error al marcar notificación como enviada: ${error.message}`);
}

/**
 * Marcar notificación como fallida
 */
export async function markNotificationAsFailed(
  notificationId: string,
  errorMessage: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({
      status: 'failed',
      error_message: errorMessage,
    })
    .eq('id', notificationId);

  if (error) throw new Error(`Error al marcar notificación como fallida: ${error.message}`);
}

/**
 * Notificar sobre creación de ticket
 */
export async function notifyTicketCreated(ticket: Ticket): Promise<void> {
  const message = `Nuevo ticket #${ticket.ticket_number}: ${ticket.title}`;
  const subject = `Ticket #${ticket.ticket_number} creado`;

  // Notificar al creador
  if (ticket.created_by) {
    await createNotification(
      ticket.id,
      ticket.created_by,
      'internal',
      'ticket_created',
      message,
      subject,
      { ticket_number: ticket.ticket_number }
    );
  }

  // Si está asignado, notificar al asignado
  if (ticket.assigned_to && ticket.assigned_to !== ticket.created_by) {
    await createNotification(
      ticket.id,
      ticket.assigned_to,
      'internal',
      'ticket_assigned',
      `Se te ha asignado el ticket #${ticket.ticket_number}: ${ticket.title}`,
      `Ticket #${ticket.ticket_number} asignado`,
      { ticket_number: ticket.ticket_number }
    );
  }
}

/**
 * Notificar sobre cambio de estado
 */
export async function notifyStatusChange(
  ticket: Ticket,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  const statusLabels: Record<string, string> = {
    new: 'Nuevo',
    in_progress: 'En Progreso',
    resolved: 'Resuelto',
    closed: 'Cerrado',
  };

  const message = `El ticket #${ticket.ticket_number} cambió de estado: ${statusLabels[oldStatus]} → ${statusLabels[newStatus]}`;
  const subject = `Cambio de estado - Ticket #${ticket.ticket_number}`;

  // Notificar al creador
  if (ticket.created_by) {
    await createNotification(
      ticket.id,
      ticket.created_by,
      'internal',
      'status_changed',
      message,
      subject,
      { 
        ticket_number: ticket.ticket_number,
        old_status: oldStatus,
        new_status: newStatus,
      }
    );
  }

  // Notificar al asignado si es diferente
  if (ticket.assigned_to && ticket.assigned_to !== ticket.created_by) {
    await createNotification(
      ticket.id,
      ticket.assigned_to,
      'internal',
      'status_changed',
      message,
      subject,
      { 
        ticket_number: ticket.ticket_number,
        old_status: oldStatus,
        new_status: newStatus,
      }
    );
  }
}

/**
 * Notificar sobre breach de SLA
 */
export async function notifySLABreach(
  ticket: Ticket,
  breachType: 'response' | 'resolution'
): Promise<void> {
  const typeLabel = breachType === 'response' ? 'primera respuesta' : 'resolución';
  const message = `⚠️ ALERTA: El ticket #${ticket.ticket_number} ha incumplido el SLA de ${typeLabel}`;
  const subject = `Alerta SLA - Ticket #${ticket.ticket_number}`;

  // Notificar al asignado o al creador
  const notifyUserId = ticket.assigned_to || ticket.created_by;
  if (notifyUserId) {
    await createNotification(
      ticket.id,
      notifyUserId,
      'internal',
      'sla_breach',
      message,
      subject,
      { 
        ticket_number: ticket.ticket_number,
        breach_type: breachType,
        hours_since_created: ticket.hours_since_created,
      }
    );
  }

  // TODO: Aquí se enviaría email/WhatsApp si está configurado
  // await sendEmailNotification(...)
  // await sendWhatsAppNotification(...)
}

/**
 * Notificar sobre advertencia de SLA (80% del tiempo)
 */
export async function notifySLAWarning(
  ticket: Ticket,
  warningType: 'response' | 'resolution',
  hoursRemaining: number
): Promise<void> {
  const typeLabel = warningType === 'response' ? 'primera respuesta' : 'resolución';
  const message = `⏰ El ticket #${ticket.ticket_number} está próximo a incumplir el SLA de ${typeLabel}. Quedan ${Math.abs(hoursRemaining).toFixed(1)} horas.`;
  const subject = `Advertencia SLA - Ticket #${ticket.ticket_number}`;

  const notifyUserId = ticket.assigned_to || ticket.created_by;
  if (notifyUserId) {
    await createNotification(
      ticket.id,
      notifyUserId,
      'internal',
      'sla_warning',
      message,
      subject,
      { 
        ticket_number: ticket.ticket_number,
        warning_type: warningType,
        hours_remaining: hoursRemaining,
      }
    );
  }
}

/**
 * Notificar sobre nueva asignación
 */
export async function notifyAssignment(
  ticket: Ticket,
  assignedToUserId: string
): Promise<void> {
  const message = `Se te ha asignado el ticket #${ticket.ticket_number}: ${ticket.title}`;
  const subject = `Nuevo ticket asignado #${ticket.ticket_number}`;

  await createNotification(
    ticket.id,
    assignedToUserId,
    'internal',
    'ticket_assigned',
    message,
    subject,
    { ticket_number: ticket.ticket_number }
  );
}

/**
 * Notificar sobre nuevo comentario
 */
export async function notifyNewComment(
  ticketId: string,
  ticketNumber: string,
  commentAuthorId: string,
  commentAuthorName: string,
  isInternal: boolean,
  recipientUserId: string
): Promise<void> {
  if (commentAuthorId === recipientUserId) {
    return; // No notificar al autor del comentario
  }

  const commentType = isInternal ? 'nota interna' : 'comentario';
  const message = `${commentAuthorName} agregó un ${commentType} al ticket #${ticketNumber}`;
  const subject = `Nuevo ${commentType} - Ticket #${ticketNumber}`;

  await createNotification(
    ticketId,
    recipientUserId,
    'internal',
    'new_comment',
    message,
    subject,
    { 
      ticket_number: ticketNumber,
      is_internal: isInternal,
      author_name: commentAuthorName,
    }
  );
}

// ============================================
// FUNCIONES DE ENVÍO (Requieren configuración)
// ============================================

/**
 * Enviar notificación por email
 * NOTA: Requiere configurar servicio de email (Resend, SendGrid, etc.)
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  message: string
): Promise<boolean> {
  // TODO: Implementar con API de email
  console.log('📧 Email (mock):', { to, subject, message });
  
  /* EJEMPLO CON RESEND:
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    await resend.emails.send({
      from: 'tickets@tudominio.com',
      to,
      subject,
      html: message,
    });
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
  */
  
  return true; // Mock
}

/**
 * Enviar notificación por WhatsApp
 * NOTA: Requiere configurar Twilio, Meta WhatsApp API, o Wassenger
 */
export async function sendWhatsAppNotification(
  phone: string,
  message: string
): Promise<boolean> {
  // TODO: Implementar con API de WhatsApp
  console.log('📱 WhatsApp (mock):', { phone, message });
  
  /* EJEMPLO CON TWILIO:
  const client = twilio(accountSid, authToken);
  
  try {
    await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${phone}`,
      body: message,
    });
    return true;
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    return false;
  }
  */
  
  return true; // Mock
}