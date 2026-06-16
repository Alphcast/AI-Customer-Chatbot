import { create } from 'zustand';
import type { Conversation, Message } from '@shared/types';

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  setConversations: (convs: Conversation[]) => void;
  setActiveConversation: (conv: Conversation | null) => void;
  setMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  isConnected: false,
  isLoading: false,
  error: null,
};

export const useChatStore = create<ChatState>((set) => ({
  ...initialState,

  setConversations: (convs) => set({ conversations: convs }),
  setActiveConversation: (conv) => set({ activeConversation: conv }),
  setMessages: (msgs) => set({ messages: msgs }),

  addMessage: (msg) =>
    set((state) => ({
      messages: state.messages.some((m) => m.id === msg.id)
        ? state.messages.map((m) => (m.id === msg.id ? msg : m))
        : [...state.messages, msg],
    })),

  setConnected: (connected) => set({ isConnected: connected }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
