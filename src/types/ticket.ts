// src/types/ticket.ts
export type TicketStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ContactMedium = 'whatsapp' | 'email' | 'phone';
export type SLAStatus = 'within_sla' | 'response_warning' | 'response_breached' | 'resolution_warning' | 'resolution_breached';
export type NotificationChannel = 'email' | 'whatsapp' | 'push' | 'internal';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered';

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  
  // Consecutivo único
  ticket_number?: string;
  
  // SLA
  sla_priority?: string;
  sla_response_time_hours?: number;
  sla_resolution_time_hours?: number;
  first_response_at?: string;
  response_sla_met?: boolean;
  resolution_sla_met?: boolean;
  sla_breach_notified?: boolean;
  auto_assigned?: boolean;
  
  created_by?: string;
  assigned_to?: string;
  
  contact_medium?: ContactMedium;
  contact_value?: string;
  
  whatsapp_phone?: string;
  whatsapp_message_id?: string;
  whatsapp_group_id?: string;
  
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  
  creator?: {
    id: string;
    full_name: string;
    email: string;
  };
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  };
  
  // Campos calculados de la vista
  hours_since_created?: number;
  hours_until_response_breach?: number;
  hours_until_resolution_breach?: number;
  sla_status?: SLAStatus;
}

// Nuevo tipo para comentarios
export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  
  user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CreateCommentDTO {
  content: string;
  is_internal?: boolean;
}

export interface CreateTicketDTO {
  title: string;
  description?: string;
  priority?: TicketPriority;
  category?: string;
  contact_medium?: ContactMedium;
  contact_value?: string;
  whatsapp_phone?: string;
  whatsapp_message_id?: string;
  whatsapp_group_id?: string;
}

export interface UpdateTicketDTO {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assigned_to?: string;
  contact_medium?: ContactMedium;
  contact_value?: string;
  whatsapp_phone?: string;
  whatsapp_message_id?: string;
  whatsapp_group_id?: string;
  first_response_at?: string;
}

export interface CloseTicketDTO {
  closing_comment: string;
  is_internal?: boolean;
}

// ============================================
// NUEVOS TIPOS PARA SLA Y NOTIFICACIONES
// ============================================

export interface SLAConfiguration {
  id: string;
  category: string;
  priority: TicketPriority;
  response_time_hours: number;
  resolution_time_hours: number;
  auto_assign_to_role?: string;
  auto_assign_criteria?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SLAHistory {
  id: string;
  ticket_id: string;
  event_type: 'response' | 'resolution' | 'breach' | 'warning';
  expected_at: string;
  actual_at?: string;
  hours_difference?: number;
  is_breach: boolean;
  notes?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  ticket_id: string;
  user_id: string;
  type: string;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  status: NotificationStatus;
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AssignmentRule {
  id: string;
  name: string;
  priority: number;
  conditions: Record<string, any>;
  assign_to_user_id?: string;
  assign_to_role?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketAlert {
  ticket_id: string;
  ticket_number: string;
  alert_type: 'response_warning' | 'response_breached' | 'resolution_warning' | 'resolution_breached';
  hours_remaining: number;
}

export interface SLAMetrics {
  total_tickets: number;
  response_sla_met: number;
  response_sla_breached: number;
  resolution_sla_met: number;
  resolution_sla_breached: number;
  avg_response_time_hours: number;
  avg_resolution_time_hours: number;
  tickets_at_risk: number;
}