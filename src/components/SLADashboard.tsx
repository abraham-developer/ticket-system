// src/components/SLADashboard.tsx - VERSIÓN MEJORADA SIN PARPADEO
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Target,
  Zap,
  Info
} from 'lucide-react';
import { useSLAMetrics } from '../hooks/useSLAMonitor';

export default function SLADashboard() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  
  const { startDate, endDate } = useMemo(() => getDateRange(dateRange), [dateRange]);
  const { metrics, loading } = useSLAMetrics(startDate, endDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!metrics || metrics.total_tickets === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No hay datos de SLA aún
          </h3>
          <p className="text-slate-400 mb-6">
            Las métricas aparecerán cuando se creen y resuelvan tickets con SLA configurado.
          </p>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-left">
            <h4 className="text-sm font-semibold text-white mb-2">Para empezar:</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>1. Configura SLA en "Config. SLA"</li>
              <li>2. Crea tickets con esas categorías</li>
              <li>3. Las métricas se calcularán automáticamente</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const responseSLAPercentage = metrics.total_tickets > 0
    ? ((metrics.response_sla_met / metrics.total_tickets) * 100).toFixed(1)
    : '0';

  const resolutionSLAPercentage = metrics.total_tickets > 0
    ? ((metrics.resolution_sla_met / metrics.total_tickets) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Filtros de Rango */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'today', label: 'Hoy' },
          { value: 'week', label: 'Esta Semana' },
          { value: 'month', label: 'Este Mes' },
          { value: 'all', label: 'Todo el Tiempo' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setDateRange(value as any)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              dateRange === value
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Tickets */}
        <MetricCard
          title="Total de Tickets"
          value={metrics.total_tickets}
          icon={Target}
          color="purple"
        />

        {/* Cumplimiento de Respuesta */}
        <MetricCard
          title="SLA Respuesta"
          value={`${responseSLAPercentage}%`}
          icon={Zap}
          color={parseFloat(responseSLAPercentage) >= 90 ? 'green' : parseFloat(responseSLAPercentage) >= 70 ? 'yellow' : 'red'}
          subtitle={`${metrics.response_sla_met} de ${metrics.total_tickets}`}
        />

        {/* Cumplimiento de Resolución */}
        <MetricCard
          title="SLA Resolución"
          value={`${resolutionSLAPercentage}%`}
          icon={CheckCircle}
          color={parseFloat(resolutionSLAPercentage) >= 90 ? 'green' : parseFloat(resolutionSLAPercentage) >= 70 ? 'yellow' : 'red'}
          subtitle={`${metrics.resolution_sla_met} de ${metrics.total_tickets}`}
        />

        {/* Tickets en Riesgo */}
        <MetricCard
          title="Tickets en Riesgo"
          value={metrics.tickets_at_risk}
          icon={AlertTriangle}
          color={metrics.tickets_at_risk > 5 ? 'red' : metrics.tickets_at_risk > 0 ? 'yellow' : 'green'}
          subtitle="Próximos a incumplir SLA"
        />
      </div>

      {/* Tiempos Promedio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TimeMetricCard
          title="Tiempo Promedio de Respuesta"
          hours={metrics.avg_response_time_hours}
          icon={Clock}
          targetHours={24} // Puedes ajustar esto según tu configuración
        />

        <TimeMetricCard
          title="Tiempo Promedio de Resolución"
          hours={metrics.avg_resolution_time_hours}
          icon={CheckCircle}
          targetHours={72} // Puedes ajustar esto según tu configuración
        />
      </div>

      {/* Incumplimientos */}
      {(metrics.response_sla_breached > 0 || metrics.resolution_sla_breached > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            Incumplimientos de SLA
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Respuesta Incumplida</span>
                <span className="text-2xl font-bold text-red-400">
                  {metrics.response_sla_breached}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.total_tickets > 0 ? (metrics.response_sla_breached / metrics.total_tickets) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Resolución Incumplida</span>
                <span className="text-2xl font-bold text-red-400">
                  {metrics.resolution_sla_breached}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.total_tickets > 0 ? (metrics.resolution_sla_breached / metrics.total_tickets) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: 'purple' | 'green' | 'yellow' | 'red' | 'blue';
  subtitle?: string;
}

function MetricCard({ title, value, icon: Icon, color, subtitle }: MetricCardProps) {
  const colorClasses = {
    purple: 'from-purple-600 to-pink-600',
    green: 'from-green-600 to-emerald-600',
    yellow: 'from-yellow-600 to-orange-600',
    red: 'from-red-600 to-pink-600',
    blue: 'from-blue-600 to-cyan-600',
  };

  const iconColors = {
    purple: 'text-purple-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-full -mr-16 -mt-16`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-sm">{title}</span>
          <Icon className={`w-5 h-5 ${iconColors[color]}`} />
        </div>
        
        <div className="text-3xl font-bold text-white mb-1">
          {value}
        </div>
        
        {subtitle && (
          <div className="text-xs text-slate-500">
            {subtitle}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface TimeMetricCardProps {
  title: string;
  hours: number;
  icon: any;
  targetHours?: number;
}

function TimeMetricCard({ title, hours, icon: Icon, targetHours }: TimeMetricCardProps) {
  const formatted = formatHours(hours);
  const isGood = targetHours ? hours <= targetHours : true;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-3 rounded-xl ${isGood ? 'bg-purple-600/20' : 'bg-orange-600/20'}`}>
          <Icon className={`w-6 h-6 ${isGood ? 'text-purple-400' : 'text-orange-400'}`} />
        </div>
        <h4 className="text-white font-semibold flex-1">{title}</h4>
        {targetHours && (
          <div className="text-xs text-slate-500">
            Meta: {formatHours(targetHours)}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2">
        <div className="text-4xl font-bold text-white">
          {formatted}
        </div>
        {targetHours && (
          <div className="flex items-center gap-1">
            {isGood ? (
              <TrendingDown className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingUp className="w-4 h-4 text-orange-400" />
            )}
            <span className={`text-xs ${isGood ? 'text-green-400' : 'text-orange-400'}`}>
              {isGood ? 'Dentro del objetivo' : 'Por encima del objetivo'}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatHours(hours: number): string {
  if (hours === 0 || isNaN(hours)) {
    return '0m';
  }
  
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  
  if (remainingHours === 0) {
    return `${days}d`;
  }
  
  return `${days}d ${remainingHours}h`;
}

function getDateRange(range: 'today' | 'week' | 'month' | 'all') {
  const now = new Date();
  let startDate: string | undefined;
  
  switch (range) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
      break;
    case 'month':
      startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
      break;
    case 'all':
      startDate = undefined;
      break;
  }
  
  return { startDate, endDate: undefined };
}