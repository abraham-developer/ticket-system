// src/components/TicketDetailModal.tsx - VERSIÓN MEJORADA
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, MessageSquare, Lock, User, CheckCircle, 
  Hash, MessageCircle, Mail, Phone, Clock, Tag, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTicketComments, createComment } from '../services/commentService';
import { closeTicket } from '../services/ticketService';
import SLAIndicator from './SLAIndicator';
import type { Ticket, TicketComment } from '../types/ticket';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onTicketUpdated: () => void;
}

export default function TicketDetailModal({ ticket, onClose, onTicketUpdated }: TicketDetailModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closingComment, setClosingComment] = useState('');

  useEffect(() => {
    loadComments();
  }, [ticket.id]);

  const loadComments = async () => {
    try {
      const data = await getTicketComments(ticket.id);
      setComments(data);
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    setLoading(true);
    try {
      await createComment(ticket.id, user.id, {
        content: newComment,
        is_internal: isInternal,
      });
      setNewComment('');
      setIsInternal(false);
      await loadComments();
    } catch (error: any) {
      console.error('Error agregando comentario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!closingComment.trim() || !user) return;

    setLoading(true);
    try {
      await closeTicket(ticket.id, user.id, {
        closing_comment: closingComment,
        is_internal: false,
      });
      setShowCloseDialog(false);
      onTicketUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error cerrando ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    new: 'bg-blue-500/10 text-blue-400 border-blue-500/50',
    in_progress: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50',
    resolved: 'bg-green-500/10 text-green-400 border-green-500/50',
    closed: 'bg-gray-500/10 text-gray-400 border-gray-500/50',
  };

  const statusLabels = {
    new: 'Nuevo',
    in_progress: 'En Progreso',
    resolved: 'Resuelto',
    closed: 'Cerrado',
  };

  const getContactIcon = () => {
    switch (ticket.contact_medium) {
      case 'whatsapp': return <MessageCircle className="w-5 h-5" />;
      case 'email': return <Mail className="w-5 h-5" />;
      case 'phone': return <Phone className="w-5 h-5" />;
      default: return null;
    }
  };

  const getContactLabel = () => {
    switch (ticket.contact_medium) {
      case 'whatsapp': return 'WhatsApp';
      case 'email': return 'Correo Electrónico';
      case 'phone': return 'Teléfono';
      default: return 'Contacto';
    }
  };

  const formatContactValue = () => {
    if (!ticket.contact_value) return '';
    
    if (ticket.contact_medium === 'phone' || ticket.contact_medium === 'whatsapp') {
      const cleaned = ticket.contact_value.replace(/\D/g, '');
      
      if (cleaned.startsWith('521') && cleaned.length === 13) {
        return `+52 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9, 13)}`;
      }
      
      if (cleaned.length === 10) {
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6, 10)}`;
      }
      
      return ticket.contact_value;
    }
    
    return ticket.contact_value;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-auto p-4"
        onClick={onClose}
      >
        <div className="min-h-screen flex items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-800 rounded-2xl w-full max-w-5xl flex flex-col border border-purple-500/20 max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                {/* Número de Ticket */}
                {ticket.ticket_number && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 px-3 py-1 bg-purple-600/20 text-purple-400 rounded-lg text-sm font-mono font-semibold">
                      <Hash className="w-4 h-4" />
                      {ticket.ticket_number}
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${statusColors[ticket.status]}`}>
                      {statusLabels[ticket.status]}
                    </span>
                  </div>
                )}

                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{ticket.title}</h2>
                
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Creado {new Date(ticket.created_at).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {ticket.category && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {ticket.category}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {ticket.description && (
              <p className="text-slate-300 text-sm md:text-base mb-4">{ticket.description}</p>
            )}

            {/* Información de Contacto y Asignación - Grid de 2 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Información de Contacto */}
              {ticket.contact_medium && ticket.contact_value && (
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-purple-600/20 rounded-lg flex-shrink-0">
                      {getContactIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-500 mb-1">
                        Medio de contacto
                      </div>
                      <div className="text-sm text-slate-400 mb-1">
                        {getContactLabel()}
                      </div>
                      <div className="text-base text-white font-medium break-all">
                        {formatContactValue()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Información de Asignación */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                {ticket.assignee ? (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-500 mb-1">
                        Asignado a
                      </div>
                      <div className="text-base text-white font-medium mb-1">
                        {ticket.assignee.full_name}
                      </div>
                      <div className="text-sm text-slate-400 break-all">
                        {ticket.assignee.email}
                      </div>
                      {ticket.auto_assigned && (
                        <div className="mt-2">
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                            Asignado automáticamente
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">Sin asignar</span>
                  </div>
                )}
              </div>
            </div>

            {/* Indicador de SLA */}
            <div className="mt-4">
              <SLAIndicator ticket={ticket} size="md" showDetails />
            </div>
          </div>

          {/* Comentarios */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay comentarios aún</p>
              </div>
            ) : (
              comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 md:p-4 rounded-xl ${
                    comment.is_internal
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : 'bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-white text-sm md:text-base">
                          {comment.user?.full_name || 'Usuario'}
                        </span>
                        {comment.is_internal && (
                          <span className="flex items-center gap-1 text-xs text-amber-400">
                            <Lock className="w-3 h-3" />
                            Interno
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {new Date(comment.created_at).toLocaleString('es-MX')}
                        </span>
                      </div>
                      <p className="text-slate-300 whitespace-pre-wrap break-words text-sm md:text-base">{comment.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Input de Comentario */}
          {ticket.status !== 'closed' && (
            <div className="p-4 md:p-6 border-t border-slate-700 space-y-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs md:text-sm text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                  />
                  <Lock className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Nota interna (solo visible para el equipo)</span>
                  <span className="sm:hidden">Nota interna</span>
                </label>
              </div>

              <div className="flex gap-2 md:gap-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-1 bg-slate-900/50 border border-purple-500/30 rounded-xl px-3 md:px-4 py-2 md:py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none text-sm md:text-base"
                  rows={3}
                />
                <button
                  onClick={handleAddComment}
                  disabled={loading || !newComment.trim()}
                  className="px-4 md:px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCloseDialog(true)}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors text-sm md:text-base"
                >
                  <CheckCircle className="w-4 h-4" />
                  Cerrar Ticket
                </button>
              </div>
            </div>
          )}
        </motion.div>
        </div>
      </div>

      {/* Dialog de Cierre */}
      <AnimatePresence>
        {showCloseDialog && (
          <div 
            className="fixed inset-0 bg-black/70 z-[60] overflow-auto p-4"
            onClick={() => setShowCloseDialog(false)}
          >
            <div className="min-h-screen flex items-center justify-center py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl p-4 md:p-6 w-full max-w-md border border-purple-500/20"
            >
              <h3 className="text-lg md:text-xl font-bold text-white mb-4">Cerrar Ticket</h3>
              <p className="text-slate-400 mb-4 text-sm md:text-base">
                Por favor, agrega un comentario final explicando la resolución del ticket:
              </p>
              <textarea
                value={closingComment}
                onChange={(e) => setClosingComment(e.target.value)}
                placeholder="Describe cómo se resolvió el ticket..."
                className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-3 md:px-4 py-2 md:py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none mb-4 text-sm md:text-base"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCloseDialog(false)}
                  className="flex-1 px-3 md:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors text-sm md:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCloseTicket}
                  disabled={loading || !closingComment.trim()}
                  className="flex-1 px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50 text-sm md:text-base"
                >
                  {loading ? 'Cerrando...' : 'Cerrar Ticket'}
                </button>
              </div>
            </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}