import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, AlertCircle } from 'lucide-react';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../contexts/AuthContext';
import TicketForm from './TicketForm';
import TicketCard from './TicketCard';
import type { CreateTicketDTO } from '../types/ticket';

export default function TicketList() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');

  console.log('🎫 TicketList rendering - user:', user);

  if (!user) {
    console.log('⚠️ No user in TicketList');
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Error: No hay usuario autenticado</p>
      </div>
    );
  }

  const { tickets, loading, error, createTicket } = useTickets(user.id);

  console.log('🎫 Tickets state:', { tickets, loading, error });

  const handleCreateTicket = async (data: CreateTicketDTO) => {
    try {
      await createTicket(data);
      setShowForm(false);
    } catch (err) {
      console.error('Error creating ticket:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const filteredTickets = tickets.filter(ticket => 
    filter === 'all' ? true : ticket.status === filter
  );

  const statusCounts = {
    all: tickets.length,
    new: tickets.filter(t => t.status === 'new').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Tickets</h2>
          <p className="text-slate-400 flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Actualizando en tiempo real
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nuevo Ticket
        </button>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400"
        >
          <AlertCircle className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'Todos', count: statusCounts.all },
          { value: 'new', label: 'Nuevos', count: statusCounts.new },
          { value: 'in_progress', label: 'En Progreso', count: statusCounts.in_progress },
          { value: 'resolved', label: 'Resueltos', count: statusCounts.resolved },
        ].map(({ value, label, count }) => (
          <button
            key={value}
            onClick={() => setFilter(value as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              filter === value
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {label}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              filter === value
                ? 'bg-white/20'
                : 'bg-slate-700'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Lista de Tickets */}
      <AnimatePresence mode="popLayout">
        {filteredTickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              {filter === 'all' 
                ? 'No hay tickets aún. Crea uno nuevo para empezar.' 
                : `No hay tickets con estado "${filter}"`
              }
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <TicketCard ticket={ticket} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Formulario Modal */}
      {showForm && (
        <TicketForm
          onSubmit={handleCreateTicket}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}