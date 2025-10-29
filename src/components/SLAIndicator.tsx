// src/components/SLAIndicator.tsx
import {  AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { Ticket, SLAStatus } from '../types/ticket';

interface SLAIndicatorProps {
  ticket: Ticket;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export default function SLAIndicator({ ticket, size = 'md', showDetails = false }: SLAIndicatorProps) {
  const slaStatus = ticket.sla_status || 'within_sla';
  
  const config = getSLAConfig(slaStatus);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="space-y-2">
      <div className={`inline-flex items-center gap-2 rounded-lg font-medium ${sizeClasses[size]} ${config.className}`}>
        <config.icon className={iconSizes[size]} />
        <span>{config.label}</span>
      </div>

      {showDetails && (
        <div className="text-xs text-slate-400 space-y-1">
          {/* Tiempo de respuesta */}
          {ticket.sla_response_time_hours && (
            <div className="flex items-center justify-between">
              <span>Respuesta esperada:</span>
              <span className="font-medium">{ticket.sla_response_time_hours}h</span>
            </div>
          )}
          
          {/* Primera respuesta */}
          {ticket.first_response_at ? (
            <div className="flex items-center justify-between">
              <span>Primera respuesta:</span>
              <span className={ticket.response_sla_met ? 'text-green-400' : 'text-red-400'}>
                {ticket.response_sla_met ? '✓ A tiempo' : '✗ Retrasada'}
              </span>
            </div>
          ) : ticket.hours_until_response_breach !== undefined && (
            <div className="flex items-center justify-between">
              <span>Tiempo restante (respuesta):</span>
              <span className={ticket.hours_until_response_breach > 0 ? 'text-yellow-400' : 'text-red-400'}>
                {formatHours(ticket.hours_until_response_breach)}
              </span>
            </div>
          )}

          {/* Tiempo de resolución */}
          {ticket.sla_resolution_time_hours && (
            <div className="flex items-center justify-between">
              <span>Resolución esperada:</span>
              <span className="font-medium">{ticket.sla_resolution_time_hours}h</span>
            </div>
          )}

          {/* Tiempo restante para resolución */}
          {ticket.hours_until_resolution_breach !== undefined && ticket.status !== 'closed' && (
            <div className="flex items-center justify-between">
              <span>Tiempo restante (resolución):</span>
              <span className={ticket.hours_until_resolution_breach > 0 ? 'text-yellow-400' : 'text-red-400'}>
                {formatHours(ticket.hours_until_resolution_breach)}
              </span>
            </div>
          )}

          {/* Tiempo transcurrido */}
          {ticket.hours_since_created !== undefined && (
            <div className="flex items-center justify-between">
              <span>Tiempo transcurrido:</span>
              <span className="font-medium">{formatHours(ticket.hours_since_created)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getSLAConfig(status: SLAStatus) {
  const configs = {
    within_sla: {
      label: 'Dentro de SLA',
      icon: CheckCircle2,
      className: 'bg-green-500/10 text-green-400 border border-green-500/30',
    },
    response_warning: {
      label: 'Respuesta Próxima',
      icon: AlertTriangle,
      className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 animate-pulse',
    },
    response_breached: {
      label: 'SLA Respuesta Incumplido',
      icon: XCircle,
      className: 'bg-red-500/10 text-red-400 border border-red-500/30',
    },
    resolution_warning: {
      label: 'Resolución Próxima',
      icon: AlertTriangle,
      className: 'bg-orange-500/10 text-orange-400 border border-orange-500/30 animate-pulse',
    },
    resolution_breached: {
      label: 'SLA Resolución Incumplido',
      icon: XCircle,
      className: 'bg-red-500/10 text-red-400 border border-red-500/30',
    },
  };

  return configs[status] || configs.within_sla;
}

function formatHours(hours: number): string {
  const absHours = Math.abs(hours);
  
  if (absHours < 1) {
    const minutes = Math.round(absHours * 60);
    return `${minutes}m`;
  }
  
  if (absHours < 24) {
    return `${Math.round(absHours * 10) / 10}h`;
  }
  
  const days = Math.floor(absHours / 24);
  const remainingHours = Math.round(absHours % 24);
  return `${days}d ${remainingHours}h`;
}

/**
 * Componente compacto de SLA para listas
 */
export function SLABadge({ ticket }: { ticket: Ticket }) {
  const slaStatus = ticket.sla_status || 'within_sla';
  
  if (slaStatus === 'within_sla') {
    return null; // No mostrar si está dentro del SLA
  }

  const isBreach = slaStatus.includes('breached');
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
      isBreach 
        ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 animate-pulse'
    }`}>
      {isBreach ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      <span>{isBreach ? 'SLA' : 'Urgente'}</span>
    </div>
  );
}