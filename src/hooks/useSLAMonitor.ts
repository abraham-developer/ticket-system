// src/hooks/useSLAMonitor.ts
import { useState, useEffect, useCallback } from 'react';
import { getTicketsRequiringAlert, markTicketAsNotified } from '../services/slaService';
import { notifySLABreach, notifySLAWarning } from '../services/notificationService';
import { supabase } from '../lib/supabase';
import type { TicketAlert } from '../types/ticket';

/**
 * Hook para monitoreo continuo de SLA
 */
export function useSLAMonitor(enabled: boolean = true, intervalSeconds: number = 60) {
  const [alerts, setAlerts] = useState<TicketAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSLAStatus = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      const ticketAlerts = await getTicketsRequiringAlert();
      setAlerts(ticketAlerts);

      // Procesar cada alerta
      for (const alert of ticketAlerts) {
        await processAlert(alert);
      }

      setError(null);
    } catch (err: any) {
      console.error('Error en monitoreo de SLA:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Verificación inicial
    checkSLAStatus();

    // Verificación periódica
    const interval = setInterval(checkSLAStatus, intervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [enabled, intervalSeconds, checkSLAStatus]);

  return {
    alerts,
    loading,
    error,
    refresh: checkSLAStatus,
  };
}

/**
 * Procesar una alerta de SLA
 */
async function processAlert(alert: TicketAlert): Promise<void> {
  try {
    // Obtener datos completos del ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        creator:created_by(id, full_name, email),
        assignee:assigned_to(id, full_name, email)
      `)
      .eq('id', alert.ticket_id)
      .single();

    if (error || !ticket) {
      console.error('Error al obtener ticket para alerta:', error);
      return;
    }

    // Determinar tipo de notificación
    if (alert.alert_type.includes('breached')) {
      // Breach: SLA incumplido
      const breachType = alert.alert_type.includes('response') ? 'response' : 'resolution';
      await notifySLABreach(ticket, breachType);
      await markTicketAsNotified(alert.ticket_id);
      
      console.log(`🚨 SLA BREACH: Ticket #${alert.ticket_number} - ${alert.alert_type}`);
    } else if (alert.alert_type.includes('warning')) {
      // Warning: Próximo a incumplir (80%)
      const warningType = alert.alert_type.includes('response') ? 'response' : 'resolution';
      await notifySLAWarning(ticket, warningType, alert.hours_remaining);
      
      console.log(`⚠️ SLA WARNING: Ticket #${alert.ticket_number} - ${alert.hours_remaining.toFixed(1)}h restantes`);
    }
  } catch (err) {
    console.error('Error procesando alerta:', err);
  }
}

/**
 * Hook para obtener métricas de SLA
 */
export function useSLAMetrics(startDate?: string, endDate?: string) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        
        const { calculateSLAMetrics } = await import('../services/slaService');
        const data = await calculateSLAMetrics(startDate, endDate);
        
        setMetrics(data);
      } catch (error) {
        console.error('Error cargando métricas SLA:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, [startDate, endDate]);

  return { metrics, loading };
}