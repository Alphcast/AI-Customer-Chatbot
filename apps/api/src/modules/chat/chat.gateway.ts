import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages/messages.service';
import { ChatService } from './chat.service';

interface ConnectedClient {
  userId: string;
  conversationId: string;
  role: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedClients = new Map<string, ConnectedClient>();
  private onlineAgents = new Set<string>();

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => MessagesService))
    private readonly messagesService: MessagesService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload;

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} authentication failed: ${(error as Error).message}`);
      client.emit('error', { message: 'Invalid authentication token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      const { userId, conversationId } = clientInfo;
      this.connectedClients.delete(client.id);

      if (clientInfo.role === 'SUPPORT_AGENT' || clientInfo.role === 'BUSINESS_OWNER' || clientInfo.role === 'SUPER_ADMIN') {
        this.onlineAgents.delete(userId);
        if (conversationId) {
          this.server.to(conversationId).emit('typing_indicator', {
            conversationId,
            userId,
            isTyping: false,
          });
        }
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(client: Socket, payload: { conversationId: string }): Promise<void> {
    try {
      const { conversationId } = payload;
      const user = client.data.user;
      if (!user) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const conversation = await this.chatService.findById(conversationId);
      if (!conversation) {
        client.emit('error', { message: 'Conversation not found' });
        return;
      }

      const isAgent = user.role === 'SUPPORT_AGENT' || user.role === 'BUSINESS_OWNER' || user.role === 'SUPER_ADMIN';
      const isParticipant = conversation.customerId === user.sub || conversation.assignedUserId === user.sub;

      if (!isAgent && !isParticipant && conversation.companyId !== user.companyId) {
        client.emit('error', { message: 'Access denied' });
        return;
      }

      client.join(conversationId);
      this.connectedClients.set(client.id, {
        userId: user.sub,
        conversationId,
        role: user.role,
      });

      if (isAgent) {
        this.onlineAgents.add(user.sub);
      }

      this.logger.log(`User ${user.sub} joined conversation ${conversationId}`);
    } catch (error) {
      this.logger.error(`join_conversation error: ${(error as Error).message}`);
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(client: Socket, payload: { conversationId: string }): void {
    const { conversationId } = payload;
    client.leave(conversationId);

    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo && clientInfo.conversationId === conversationId) {
      this.connectedClients.delete(client.id);
    }

    this.logger.log(`Client ${client.id} left conversation ${conversationId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: { conversationId: string }): void {
    const user = client.data.user;
    if (!user) return;

    client.to(payload.conversationId).emit('typing_indicator', {
      conversationId: payload.conversationId,
      userId: user.sub,
      isTyping: true,
    });
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(client: Socket, payload: { conversationId: string }): void {
    const user = client.data.user;
    if (!user) return;

    client.to(payload.conversationId).emit('typing_indicator', {
      conversationId: payload.conversationId,
      userId: user.sub,
      isTyping: false,
    });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(client: Socket, payload: { conversationId: string; content: string; type?: string }): Promise<void> {
    try {
      const user = client.data.user;
      if (!user) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const message = await this.messagesService.create(
        {
          conversationId: payload.conversationId,
          content: payload.content,
          type: (payload.type as any) || 'TEXT',
        },
        user.sub,
        user.role === 'CUSTOMER' ? undefined : user.sub,
      );

      this.server.to(payload.conversationId).emit('new_message', message);
    } catch (error) {
      this.logger.error(`send_message error: ${(error as Error).message}`);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(client: Socket, payload: { conversationId: string; messageIds: string[] }): Promise<void> {
    try {
      const user = client.data.user;
      if (!user) return;

      await this.messagesService.markAsRead(payload.messageIds, user.sub);

      this.server.to(payload.conversationId).emit('conversation_updated', {
        conversationId: payload.conversationId,
        readBy: user.sub,
        messageIds: payload.messageIds,
      });
    } catch (error) {
      this.logger.error(`mark_read error: ${(error as Error).message}`);
      client.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  emitNewMessage(conversationId: string, message: any): void {
    this.server.to(conversationId).emit('new_message', message);
  }

  emitConversationUpdated(conversationId: string, data: any): void {
    this.server.to(conversationId).emit('conversation_updated', data);
  }

  isAgentOnline(userId: string): boolean {
    return this.onlineAgents.has(userId);
  }

  getOnlineAgents(): string[] {
    return Array.from(this.onlineAgents);
  }
}
