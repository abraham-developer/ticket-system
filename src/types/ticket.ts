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
  
  // Canales de comunicación
  contact_medium?: ContactMedium;
  contact_value?: string; // email o teléfono normal
  
  // WhatsApp específico
  whatsapp_phone?: string; // Formato: 5215562123358@s.whatsapp.net
  whatsapp_message_id?: string;
  whatsapp_group_id?: string;
  
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  
  // Relaciones (cuando se hacen joins)
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