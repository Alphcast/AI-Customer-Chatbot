'use client';

import { useEffect, useCallback } from 'react';
import { useChatStore } from '@/store/chat-store';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { getToken } from '@/lib/auth';
import api from '@/lib/api';
import type { Message, Conversation, PaginatedResponse } from '@/types';

export function useChat() {
  const {
    conversations,
    activeConversation,
    messages,
    isConnected,
    isTyping,
    isLoadingConversations,
    isLoadingMessages,
    error,
    setConversations,
    setActiveConversation,
    setMessages,
    appendMessage,
    setConnected,
    setTyping,
    setLoadingConversations,
    setLoadingMessages,
    setError,
    updateConversation,
    reset,
  } = useChatStore();

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = getSocket(token);
    if (!socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('message:new', (message: Message) => {
      appendMessage(message);
      updateConversation(message.conversationId, {
        lastMessageAt: message.createdAt,
      });
    });

    socket.on('message:updated', (message: Message) => {
      const { updateMessage } = useChatStore.getState();
      updateMessage(message.id, message);
    });

    socket.on('conversation:updated', (conversation: Conversation) => {
      updateConversation(conversation.id, conversation);
    });

    socket.on('typing:start', () => {
      setTyping(true);
    });

    socket.on('typing:stop', () => {
      setTyping(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message:new');
      socket.off('message:updated');
      socket.off('conversation:updated');
      socket.off('typing:start');
      socket.off('typing:stop');
      disconnectSocket();
      reset();
    };
  }, [appendMessage, updateConversation, setConnected, setTyping, reset]);

  const sendMessage = useCallback(
    async (content: string, conversationId: string) => {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('message:send', { content, conversationId });
        return;
      }

      try {
        const response = await api.post<Message>(
          `/conversations/${conversationId}/messages`,
          { content },
        );
        appendMessage(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
    },
    [appendMessage, setError],
  );

  const createConversation = useCallback(
    async (data: { subject?: string; customerId?: string; agentId?: string }) => {
      try {
        const response = await api.post<Conversation>('/conversations', data);
        setConversations([response.data, ...conversations]);
        return response.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create conversation',
        );
        return null;
      }
    },
    [conversations, setConversations, setError],
  );

  const getConversationsList = useCallback(
    async (params?: { page?: number; limit?: number; status?: string }) => {
      setLoadingConversations(true);
      try {
        const response = await api.get<PaginatedResponse<Conversation>>(
          '/conversations',
          { params },
        );
        setConversations(response.data.data);
        return response.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch conversations',
        );
        return null;
      } finally {
        setLoadingConversations(false);
      }
    },
    [setConversations, setLoadingConversations, setError],
  );

  const getMessagesList = useCallback(
    async (
      conversationId: string,
      params?: { page?: number; limit?: number },
    ) => {
      setLoadingMessages(true);
      try {
        const response = await api.get<PaginatedResponse<Message>>(
          `/conversations/${conversationId}/messages`,
          { params },
        );
        setMessages(response.data.data);
        return response.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch messages',
        );
        return null;
      } finally {
        setLoadingMessages(false);
      }
    },
    [setMessages, setLoadingMessages, setError],
  );

  const selectConversation = useCallback(
    (conversation: Conversation | null) => {
      setActiveConversation(conversation);
      if (conversation) {
        getMessagesList(conversation.id);
      } else {
        setMessages([]);
      }
    },
    [setActiveConversation, getMessagesList, setMessages],
  );

  const emitTyping = useCallback((conversationId: string, isTyping: boolean) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
        conversationId,
      });
    }
  }, []);

  return {
    conversations,
    activeConversation,
    messages,
    isConnected,
    isTyping,
    isLoadingConversations,
    isLoadingMessages,
    error,
    sendMessage,
    createConversation,
    getConversations: getConversationsList,
    getMessages: getMessagesList,
    selectConversation,
    emitTyping,
    setError,
  };
}
