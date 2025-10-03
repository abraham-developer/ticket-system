import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as ticketService from '../services/ticketService';
import type { Ticket, CreateTicketDTO, UpdateTicketDTO } from '../types/ticket';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useTickets(userId: string) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getTickets(userId);
      setTickets(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();

    // Suscripción a cambios en tiempo real
    const channel: RealtimeChannel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tickets',
        },
        async (payload) => {
          console.log('🔴 Cambio en tiempo real:', payload);

          if (payload.eventType === 'INSERT') {
            // Nuevo ticket creado
            const newTicket = await ticketService.getTicketById(payload.new.id);
            if (newTicket) {
              // Verificar si el ticket es relevante para este usuario
              if (
                newTicket.created_by === userId || 
                newTicket.assigned_to === userId
              ) {
                setTickets((prev) => {
                  // Evitar duplicados
                  if (prev.some(t => t.id === newTicket.id)) {
                    return prev;
                  }
                  return [newTicket, ...prev];
                });
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            // Ticket actualizado
            const updatedTicket = await ticketService.getTicketById(payload.new.id);
            if (updatedTicket) {
              setTickets((prev) => {
                // Si el ticket ya existe, actualizarlo
                const exists = prev.some(t => t.id === updatedTicket.id);
                
                if (exists) {
                  return prev.map((ticket) =>
                    ticket.id === updatedTicket.id ? updatedTicket : ticket
                  );
                }
                
                // Si no existe pero ahora es relevante, agregarlo
                if (
                  updatedTicket.created_by === userId || 
                  updatedTicket.assigned_to === userId
                ) {
                  return [updatedTicket, ...prev];
                }
                
                return prev;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            // Ticket eliminado
            setTickets((prev) =>
              prev.filter((ticket) => ticket.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup: desuscribirse al desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const createTicket = async (data: CreateTicketDTO) => {
    try {
      const newTicket = await ticketService.createTicket(data, userId);
      // No es necesario actualizar el estado aquí, 
      // el evento de realtime lo hará automáticamente
      return newTicket;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateTicket = async (id: string, data: UpdateTicketDTO) => {
    try {
      const updated = await ticketService.updateTicket(id, data);
      // El evento de realtime actualizará el estado
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTicket = async (id: string) => {
    try {
      await ticketService.deleteTicket(id);
      // El evento de realtime eliminará del estado
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateTicket,
    deleteTicket,
    refresh: loadTickets,
  };
}