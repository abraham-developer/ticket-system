// src/types/ticket.ts
export type TicketStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ContactMedium = 'whatsapp' | 'email' | 'phone';

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  
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
}

export interface CloseTicketDTO {
  closing_comment: string;
  is_internal?: boolean;
}