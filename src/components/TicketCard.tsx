import { motion } from 'framer-motion';
import { MessageCircle, Mail, Phone, User, Clock } from 'lucide-react';
import type { Ticket } from '../types/ticket';

interface TicketCardProps {
  ticket: Ticket;
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

export default function TicketCard({ ticket }: TicketCardProps) {
  const getContactIcon = () => {
    switch (ticket.contact_medium) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/40 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white truncate">
              {ticket.title}
            </h3>
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

          {/* Metadatos */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Prioridad */}
            <div className={`flex items-center gap-1 ${priorityColors[ticket.priority]}`}>
              <div className="w-2 h-2 rounded-full bg-current"></div>
              <span className="capitalize">{ticket.priority}</span>
            </div>

            {/* Categoría */}
            {ticket.category && (
              <span className="text-slate-500">
                {ticket.category}
              </span>
            )}

            {/* Contacto */}
            {ticket.contact_medium && (
              <div className="flex items-center gap-1 text-slate-500">
                {getContactIcon()}
                <span className="capitalize">{ticket.contact_medium}</span>
              </div>
            )}

            {/* Fecha */}
            <div className="flex items-center gap-1 text-slate-500">
              <Clock className="w-4 h-4" />
              {new Date(ticket.created_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Asignado a */}
          {ticket.assignee && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400">Asignado a:</span>
              <span className="text-white font-medium">{ticket.assignee.full_name}</span>
            </div>
          )}

          {/* Info de WhatsApp */}
          {ticket.whatsapp_phone && (
            <div className="mt-2 text-xs text-slate-500">
              📱 {ticket.whatsapp_phone}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}