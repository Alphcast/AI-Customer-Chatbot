import { create } from 'zustand';
import type { Ticket } from '@shared/types';

interface TicketState {
  tickets: Ticket[];
  activeTicket: Ticket | null;
  isLoading: boolean;
  error: string | null;
  setTickets: (tickets: Ticket[]) => void;
  setActiveTicket: (ticket: Ticket | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTicketStore = create<TicketState>((set) => ({
  tickets: [],
  activeTicket: null,
  isLoading: false,
  error: null,
  setTickets: (tickets) => set({ tickets }),
  setActiveTicket: (ticket) => set({ activeTicket: ticket }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
