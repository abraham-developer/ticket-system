import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as ticketService from '../services/ticketService';
import type { Ticket, CreateTicketDTO, UpdateTicketDTO } from '../types/ticket';

export function useTickets(userId: string) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('CONNECTING');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getTickets(userId);
      console.log('📥 Tickets cargados:', data.length);
      setTickets(data);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error cargando tickets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 Iniciando suscripción Realtime para user:', userId);
    loadTickets();

    // Crear canal único
    const channelName = `tickets:${userId}`;
    console.log('📡 Creando canal:', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        async (payload) => {
          console.log('🔥 REALTIME RECIBIDO:', {
            type: payload.eventType,
            table: payload.table,
            new: payload.new,
            old: payload.old
          });

          if (payload.eventType === 'INSERT') {
            const newTicket = await ticketService.getTicketById(payload.new.id);
            if (newTicket && (newTicket.created_by === userId || newTicket.assigned_to === userId)) {
              setTickets((prev) => {
                if (prev.some(t => t.id === newTicket.id)) {
                  console.log('⚠️ Ticket duplicado, ignorando');
                  return prev;
                }
                console.log('✅ Agregando ticket:', newTicket.id);
                return [newTicket, ...prev];
              });
            }
          } 
          
          else if (payload.eventType === 'UPDATE') {
            const updatedTicket = await ticketService.getTicketById(payload.new.id);
            if (updatedTicket) {
              setTickets((prev) => {
                const exists = prev.some(t => t.id === updatedTicket.id);
                if (exists) {
                  console.log('🔄 Actualizando ticket:', updatedTicket.id);
                  return prev.map(t => t.id === updatedTicket.id ? updatedTicket : t);
                }
                if (updatedTicket.created_by === userId || updatedTicket.assigned_to === userId) {
                  return [updatedTicket, ...prev];
                }
                return prev;
              });
            }
          } 
          
          else if (payload.eventType === 'DELETE') {
            console.log('🗑️ Eliminando ticket:', payload.old.id);
            setTickets((prev) => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('📊 Estado WebSocket:', status);
        setRealtimeStatus(status);

        if (status === 'SUBSCRIBED') {
          console.log('✅ WebSocket CONECTADO - Realtime activo');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en WebSocket');
          setError('Error en conexión Realtime');
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ WebSocket timeout');
          setError('Timeout en conexión Realtime');
        } else if (status === 'CLOSED') {
          console.warn('🔌 WebSocket cerrado');
        }
      });

    // Cleanup
    return () => {
      console.log('🔌 Desconectando WebSocket');
      channel.unsubscribe();
    };
  }, [userId]);

  const createTicket = async (data: CreateTicketDTO) => {
    try {
      const newTicket = await ticketService.createTicket(data, userId);
      
      // UI optimista
      setTickets(prev => {
        if (prev.some(t => t.id === newTicket.id)) return prev;
        return [newTicket, ...prev];
      });
      
      return newTicket;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateTicket = async (id: string, data: UpdateTicketDTO) => {
    try {
      const updated = await ticketService.updateTicket(id, data);
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTicket = async (id: string) => {
    try {
      await ticketService.deleteTicket(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    tickets,
    loading,
    error,
    realtimeStatus,
    createTicket,
    updateTicket,
    deleteTicket,
    refresh: loadTickets,
  };
}