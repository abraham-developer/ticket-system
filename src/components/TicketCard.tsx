// src/components/TicketCard.tsx - VERSIÓN MEJORADA
import { motion } from 'framer-motion';
import { MessageCircle, Mail, Phone, User, Clock, Hash } from 'lucide-react';
import { SLABadge } from './SLAIndicator';
import type { Ticket } from '../types/ticket';

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
}

const statusColors = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/50',
  in_progress: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50',
  resolved: 'bg-green-500/10 text-green-400 border-green-500/50',
  closed: 'bg-gray-500/10 text-gray-400 border-gray-500/50',
};

const priorityColors = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
};

const statusLabels = {
  new: 'Nuevo',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export default function TicketCard({ ticket, onClick }: TicketCardProps) {
  const getContactIcon = () => {
    switch (ticket.contact_medium) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      default: return null;
    }
  };

  const getContactLabel = () => {
    switch (ticket.contact_medium) {
      case 'whatsapp': return 'WhatsApp';
      case 'email': return 'Email';
      case 'phone': return 'Teléfono';
      default: return '';
    }
  };

  const formatContactValue = () => {
    if (!ticket.contact_value) return '';
    
    // Si es teléfono o WhatsApp, formatear el número
    if (ticket.contact_medium === 'phone' || ticket.contact_medium === 'whatsapp') {
      const cleaned = ticket.contact_value.replace(/\D/g, '');
      
      // Si empieza con 521 (México con código de país)
      if (cleaned.startsWith('521') && cleaned.length === 13) {
        return `+52 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9, 13)}`;
      }
      
      // Si es un número de 10 dígitos (México sin código)
      if (cleaned.length === 10) {
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6, 10)}`;
      }
      
      return ticket.contact_value;
    }
    
    return ticket.contact_value;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/40 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header con número, título y badges */}
          <div className="flex items-start gap-3 mb-2 flex-wrap">
            {/* Número de Ticket */}
            {ticket.ticket_number && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-600/20 text-purple-400 rounded-lg text-xs font-mono font-semibold">
                <Hash className="w-3 h-3" />
                {ticket.ticket_number}
              </div>
            )}
            
            {/* Título */}
            <h3 className="text-lg font-semibold text-white truncate flex-1 min-w-0">
              {ticket.title}
            </h3>
            
            {/* Badge de SLA */}
            <SLABadge ticket={ticket} />
            
            {/* Estado */}
            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${statusColors[ticket.status]}`}>
              {statusLabels[ticket.status]}
            </span>
          </div>

          {/* Descripción */}
          {ticket.description && (
            <p className="text-slate-400 text-sm mb-3 line-clamp-2">
              {ticket.description}
            </p>
          )}

          {/* Información de contacto */}
          {ticket.contact_medium && ticket.contact_value && (
            <div className="mb-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  {getContactIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500 mb-0.5">
                    {getContactLabel()}
                  </div>
                  <div className="text-sm text-white font-medium truncate">
                    {formatContactValue()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {/* Prioridad */}
            <div className={`flex items-center gap-1 ${priorityColors[ticket.priority]}`}>
              <div className="w-2 h-2 rounded-full bg-current"></div>
              <span>{priorityLabels[ticket.priority]}</span>
            </div>

            {/* Categoría */}
            {ticket.category && (
              <span className="text-slate-500 px-2 py-1 bg-slate-800 rounded">
                {ticket.category}
              </span>
            )}

            {/* Fecha de creación */}
            <div className="flex items-center gap-1 text-slate-500">
              <Clock className="w-4 h-4" />
              {new Date(ticket.created_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>

            {/* Tiempo SLA restante */}
            {ticket.hours_until_resolution_breach !== undefined && 
             ticket.status !== 'closed' && 
             ticket.status !== 'resolved' && (
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                ticket.hours_until_resolution_breach < 0 
                  ? 'bg-red-500/20 text-red-400'
                  : ticket.hours_until_resolution_breach < 2
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                <Clock className="w-3 h-3" />
                {ticket.hours_until_resolution_breach > 0 
                  ? `${Math.round(ticket.hours_until_resolution_breach)}h restantes`
                  : `Vencido hace ${Math.abs(Math.round(ticket.hours_until_resolution_breach))}h`
                }
              </div>
            )}
          </div>

          {/* Asignación */}
          {ticket.assignee && (
            <div className="mt-3 flex items-center gap-2 text-sm p-2 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-slate-400 text-xs">Asignado a:</span>
                <span className="text-white font-medium ml-2 truncate">
                  {ticket.assignee.full_name}
                </span>
              </div>
              {ticket.auto_assigned && (
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                  Auto
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}