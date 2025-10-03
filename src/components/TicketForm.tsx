import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MessageCircle, Mail, Phone } from 'lucide-react';
import type { CreateTicketDTO, ContactMedium, TicketPriority } from '../types/ticket';
import { formatWhatsAppPhone } from '../services/ticketService';

interface TicketFormProps {
  onSubmit: (data: CreateTicketDTO) => Promise<void>;
  onClose: () => void;
}

export default function TicketForm({ onSubmit, onClose }: TicketFormProps) {
  const [formData, setFormData] = useState<CreateTicketDTO>({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    contact_medium: 'email',
    contact_value: '',
    whatsapp_phone: '',
    whatsapp_message_id: '',
    whatsapp_group_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = { ...formData };

      // Si es WhatsApp, formatear el teléfono
      if (formData.contact_medium === 'whatsapp' && formData.contact_value) {
        submitData.whatsapp_phone = formatWhatsAppPhone(formData.contact_value);
      }

      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear el ticket');
    } finally {
      setLoading(false);
    }
  };

  const contactMediums: { value: ContactMedium; label: string; icon: any }[] = [
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'phone', label: 'Teléfono', icon: Phone },
  ];

  const priorities: { value: TicketPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Baja', color: 'text-green-400' },
    { value: 'medium', label: 'Media', color: 'text-yellow-400' },
    { value: 'high', label: 'Alta', color: 'text-orange-400' },
    { value: 'urgent', label: 'Urgente', color: 'text-red-400' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-purple-500/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Nuevo Ticket</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              placeholder="Resumen del problema"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 min-h-[100px]"
              placeholder="Describe el problema en detalle..."
            />
          </div>

          {/* Prioridad y Categoría */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Categoría
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                placeholder="Ej: Soporte, Ventas"
              />
            </div>
          </div>

          {/* Medio de Contacto */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Medio de Contacto
            </label>
            <div className="grid grid-cols-3 gap-2">
              {contactMediums.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, contact_medium: value })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                    formData.contact_medium === value
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900/50 text-slate-400 hover:text-white border border-purple-500/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {formData.contact_medium === 'whatsapp' && 'WhatsApp'}
              {formData.contact_medium === 'email' && 'Email'}
              {formData.contact_medium === 'phone' && 'Teléfono'}
            </label>
            <input
              type={formData.contact_medium === 'email' ? 'email' : 'text'}
              value={formData.contact_value}
              onChange={(e) => setFormData({ ...formData, contact_value: e.target.value })}
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              placeholder={
                formData.contact_medium === 'whatsapp' ? '5215512345678' :
                formData.contact_medium === 'email' ? 'correo@ejemplo.com' :
                '5512345678'
              }
            />
          </div>

          {/* Campos adicionales de WhatsApp */}
          {formData.contact_medium === 'whatsapp' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ID de Mensaje (opcional)
                </label>
                <input
                  type="text"
                  value={formData.whatsapp_message_id}
                  onChange={(e) => setFormData({ ...formData, whatsapp_message_id: e.target.value })}
                  className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  placeholder="mensaje_id_123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ID de Grupo (opcional)
                </label>
                <input
                  type="text"
                  value={formData.whatsapp_group_id}
                  onChange={(e) => setFormData({ ...formData, whatsapp_group_id: e.target.value })}
                  className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  placeholder="grupo_id_456"
                />
              </div>
            </>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Ticket'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}