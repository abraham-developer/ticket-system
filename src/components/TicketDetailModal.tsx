import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, MessageSquare, Lock, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTicketComments, createComment } from '../services/commentService';
import { closeTicket } from '../services/ticketService';
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-purple-500/20"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{ticket.title}</h2>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${statusColors[ticket.status]}`}>
                  {statusLabels[ticket.status]}
                </span>
                <span className="text-slate-400 text-sm">
                  Creado {new Date(ticket.created_at).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {ticket.description && (
            <p className="mt-4 text-slate-300">{ticket.description}</p>
          )}
        </div>

        {/* Comentarios */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay comentarios aún</p>
            </div>
          ) : (
            comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl ${
                  comment.is_internal
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'bg-slate-700/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">
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
                    <p className="text-slate-300 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Input de Comentario */}
        {ticket.status !== 'closed' && (
          <div className="p-6 border-t border-slate-700 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                />
                <Lock className="w-4 h-4" />
                Nota interna (solo visible para el equipo)
              </label>
            </div>

            <div className="flex gap-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
                rows={3}
              />
              <button
                onClick={handleAddComment}
                disabled={loading || !newComment.trim()}
                className="px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Cerrar Ticket
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Dialog de Cierre */}
      {showCloseDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4" style={{ zIndex: 60 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-purple-500/20"
          >
            <h3 className="text-xl font-bold text-white mb-4">Cerrar Ticket</h3>
            <p className="text-slate-400 mb-4">
              Por favor, agrega un comentario final explicando la resolución del ticket:
            </p>
            <textarea
              value={closingComment}
              onChange={(e) => setClosingComment(e.target.value)}
              placeholder="Describe cómo se resolvió el ticket..."
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseDialog(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseTicket}
                disabled={loading || !closingComment.trim()}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Cerrando...' : 'Cerrar Ticket'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}