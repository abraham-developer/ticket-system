// src/components/SLAAlertMonitor.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bell, X } from 'lucide-react';
import { useSLAMonitor } from '../hooks/useSLAMonitor';

interface SLAAlertMonitorProps {
  enabled?: boolean;
  intervalSeconds?: number;
}

export default function SLAAlertMonitor({ enabled = true, intervalSeconds = 60 }: SLAAlertMonitorProps) {
  const { alerts, loading } = useSLAMonitor(enabled, intervalSeconds);

  if (!enabled || alerts.length === 0) {
    return null;
  }

  const breachAlerts = alerts.filter(a => a.alert_type.includes('breached'));
  const warningAlerts = alerts.filter(a => a.alert_type.includes('warning'));

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      <AnimatePresence>
        {/* Alertas de breach (críticas) */}
        {breachAlerts.map((alert) => (
          <AlertCard
            key={alert.ticket_id}
            alert={alert}
            type="breach"
          />
        ))}

        {/* Alertas de warning */}
        {warningAlerts.slice(0, 3).map((alert) => (
          <AlertCard
            key={alert.ticket_id}
            alert={alert}
            type="warning"
          />
        ))}

        {/* Indicador de más alertas */}
        {warningAlerts.length > 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center"
          >
            <span className="text-yellow-400 text-sm font-medium">
              +{warningAlerts.length - 3} alertas más
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AlertCardProps {
  alert: any;
  type: 'breach' | 'warning';
}

function AlertCard({ alert, type }: AlertCardProps) {
  const isBreach = type === 'breach';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`${
        isBreach
          ? 'bg-red-500/10 border-red-500/50'
          : 'bg-yellow-500/10 border-yellow-500/50'
      } border rounded-xl p-4 backdrop-blur-xl shadow-lg`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          isBreach ? 'bg-red-500/20' : 'bg-yellow-500/20'
        }`}>
          {isBreach ? (
            <Bell className="w-5 h-5 text-red-400 animate-pulse" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold mb-1 ${
            isBreach ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {isBreach ? '🚨 SLA Incumplido' : '⏰ SLA Próximo a Vencer'}
          </h4>
          
          <p className="text-white text-sm mb-2">
            Ticket #{alert.ticket_number}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {alert.hours_remaining > 0 ? (
              <span>Quedan {Math.abs(alert.hours_remaining).toFixed(1)}h</span>
            ) : (
              <span>Vencido hace {Math.abs(alert.hours_remaining).toFixed(1)}h</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Badge compacto para mostrar cantidad de alertas
 */
export function SLAAlertBadge() {
  const { alerts } = useSLAMonitor(true, 60);
  
  if (alerts.length === 0) return null;

  const breachCount = alerts.filter(a => a.alert_type.includes('breached')).length;
  
  return (
    <div className="relative">
      <Bell className="w-5 h-5 text-slate-400" />
      {alerts.length > 0 && (
        <span className={`absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs font-bold rounded-full ${
          breachCount > 0 ? 'bg-red-500' : 'bg-yellow-500'
        } text-white animate-pulse`}>
          {alerts.length > 9 ? '9+' : alerts.length}
        </span>
      )}
    </div>
  );
}