import { create } from 'zustand';
import type { Conversation, Message } from '@/types';

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isConnected: boolean;
  isTyping: boolean;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  setConversations: (convs: Conversation[]) => void;
  setActiveConversation: (conv: Conversation | null) => void;
  addMessage: (msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
  appendMessage: (msg: Message) => void;
  setConnected: (connected: boolean) => void;
  setTyping: (typing: boolean) => void;
  setLoadingConversations: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  reset: () => void;
}

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  isConnected: false,
  isTyping: false,
  isLoadingConversations: false,
  isLoadingMessages: false,
  error: null,
};

export const useChatStore = create<ChatState>((set) => ({
  ...initialState,

  setConversations: (convs) => set({ conversations: convs }),

  setActiveConversation: (conv) => set({ activeConversation: conv }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  setMessages: (msgs) => set({ messages: msgs }),

  appendMessage: (msg) =>
    set((state) => ({
      messages: state.messages.some((m) => m.id === msg.id)
        ? state.messages.map((m) => (m.id === msg.id ? msg : m))
        : [...state.messages, msg],
    })),

  setConnected: (connected) => set({ isConnected: connected }),

  setTyping: (typing) => set({ isTyping: typing }),

  setLoadingConversations: (loading) =>
    set({ isLoadingConversations: loading }),

  setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

  setError: (error) => set({ error }),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
      activeConversation:
        state.activeConversation?.id === id
          ? { ...state.activeConversation, ...updates }
          : state.activeConversation,
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    })),

  reset: () => set(initialState),
}));
