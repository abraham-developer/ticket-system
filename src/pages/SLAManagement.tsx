// src/pages/SLAManagement.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Clock, AlertTriangle, Save, X } from 'lucide-react';
import { getSLAConfigurations, upsertSLAConfiguration } from '../services/slaService';
import type { SLAConfiguration, TicketPriority } from '../types/ticket';

export default function SLAManagement() {
  const [configs, setConfigs] = useState<SLAConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SLAConfiguration | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await getSLAConfigurations();
      setConfigs(data);
    } catch (error) {
      console.error('Error cargando configuraciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (config: Partial<SLAConfiguration>) => {
    try {
      await upsertSLAConfiguration(config);
      await loadConfigs();
      setShowForm(false);
      setEditingConfig(null);
    } catch (error: any) {
      alert('Error al guardar: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-7 h-7 text-purple-400" />
            Configuración de SLA
          </h2>
          <p className="text-slate-400 mt-1">
            Define los tiempos de respuesta y resolución por categoría
          </p>
        </div>
        <button
          onClick={() => {
            setEditingConfig(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nueva Configuración
        </button>
      </div>

      {/* Lista de Configuraciones */}
      <div className="grid gap-4">
        {configs.map((config) => (
          <ConfigCard
            key={config.id}
            config={config}
            onEdit={() => {
              setEditingConfig(config);
              setShowForm(true);
            }}
          />
        ))}

        {configs.length === 0 && (
          <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700">
            <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay configuraciones de SLA</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-purple-400 hover:text-purple-300"
            >
              Crear la primera configuración
            </button>
          </div>
        )}
      </div>

      {/* Formulario Modal */}
      {showForm && (
        <SLAConfigForm
          config={editingConfig}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingConfig(null);
          }}
        />
      )}
    </div>
  );
}

interface ConfigCardProps {
  config: SLAConfiguration;
  onEdit: () => void;
}

function ConfigCard({ config, onEdit }: ConfigCardProps) {
  const priorityColors: Record<string, string> = {
    urgent: 'text-red-400 bg-red-500/10 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-green-400 bg-green-500/10 border-green-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-semibold text-white">
              {config.category}
            </h3>
            <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${priorityColors[config.priority] || priorityColors.medium}`}>
              {config.priority.toUpperCase()}
            </span>
            {!config.is_active && (
              <span className="px-3 py-1 rounded-lg text-sm font-medium bg-slate-700 text-slate-400">
                Inactivo
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tiempo de Respuesta */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-400">Tiempo de Respuesta</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {config.response_time_hours}h
              </div>
            </div>

            {/* Tiempo de Resolución */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-green-400" />
                <span className="text-sm text-slate-400">Tiempo de Resolución</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {config.resolution_time_hours}h
              </div>
            </div>

            {/* Asignación Automática */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-slate-400">Auto-asignación</span>
              </div>
              <div className="text-lg font-medium text-white">
                {config.auto_assign_to_role || 'No configurado'}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onEdit}
          className="ml-4 p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Edit2 className="w-5 h-5 text-slate-400" />
        </button>
      </div>
    </motion.div>
  );
}

interface SLAConfigFormProps {
  config: SLAConfiguration | null;
  onSave: (config: Partial<SLAConfiguration>) => void;
  onClose: () => void;
}

function SLAConfigForm({ config, onSave, onClose }: SLAConfigFormProps) {
  const [formData, setFormData] = useState({
    category: config?.category || '',
    priority: config?.priority || 'medium' as TicketPriority,
    response_time_hours: config?.response_time_hours || 24,
    resolution_time_hours: config?.resolution_time_hours || 72,
    auto_assign_to_role: config?.auto_assign_to_role || '',
    is_active: config?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...config,
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl border border-purple-500/20"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">
            {config ? 'Editar' : 'Nueva'} Configuración SLA
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Categoría *
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              placeholder="Ej: Soporte Técnico, Ventas, etc."
              required
            />
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prioridad
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          {/* Tiempos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tiempo de Respuesta (horas) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.response_time_hours}
                onChange={(e) => setFormData({ ...formData, response_time_hours: parseInt(e.target.value) })}
                className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tiempo de Resolución (horas) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.resolution_time_hours}
                onChange={(e) => setFormData({ ...formData, resolution_time_hours: parseInt(e.target.value) })}
                className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
          </div>

          {/* Auto-asignación */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Rol para Auto-asignación (opcional)
            </label>
            <select
              value={formData.auto_assign_to_role}
              onChange={(e) => setFormData({ ...formData, auto_assign_to_role: e.target.value })}
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Sin auto-asignación</option>
              <option value="agent">Agente</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="is_active" className="text-sm text-slate-300">
              Configuración activa
            </label>
          </div>

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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Guardar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}