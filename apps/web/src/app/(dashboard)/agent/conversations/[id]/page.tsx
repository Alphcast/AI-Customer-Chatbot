'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatTime, formatDate, formatRelativeTime, getInitials, cn } from '@/lib/utils';
import {
  ArrowLeft,
  Send,
  Phone,
  Mail,
  Bot,
  Lightbulb,
  Zap,
  CheckCircle2,
  UserPlus,
  Clock,
  MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Conversation, Message } from '@/types';

const quickReplies = [
  'Let me look into that for you.',
  'I understand your concern.',
  'Could you please provide more details?',
  'I have escalated this to our team.',
  'Thank you for your patience!',
  'Is there anything else I can help with?',
];

const copilotSuggestions = [
  {
    title: 'Response Suggestion',
    text: "Based on the customer's issue, suggest checking their account settings and verifying the email address on file.",
  },
  {
    title: 'Knowledge Match',
    text: 'Found related article: "How to reset your password" in Knowledge Base.',
  },
  {
    title: 'Sentiment Analysis',
    text: 'Customer sentiment appears frustrated. Recommend empathetic tone and swift resolution.',
  },
];

export default function AgentConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading } = useQuery({
    queryKey: ['agent', 'conversation', id],
    queryFn: async () => {
      const res = await api.get(`/agent/conversations/${id}`);
      return res.data.data as Conversation;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.post(`/agent/conversations/${id}/messages`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'conversation', id] });
      setNewMessage('');
    },
    onError: () => toast.error('Failed to send message'),
  });

  const resolveMutation = useMutation({
    mutationFn: async () => api.patch(`/agent/conversations/${id}`, { status: 'resolved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'conversation', id] });
      toast.success('Conversation resolved');
    },
    onError: () => toast.error('Failed to resolve'),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage.trim());
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <div className="animate-pulse space-y-4 w-full max-w-3xl">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-96 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Conversation not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/agent/conversations')}>
          Back to Conversations
        </Button>
      </div>
    );
  }

  const customerName = conversation.customer
    ? `${conversation.customer.firstName || ''} ${conversation.customer.lastName || ''}`.trim() || conversation.customer.email
    : 'Anonymous';

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-3 border-b pb-3 mb-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/agent/conversations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar size="md" fallback={customerName.charAt(0)} src={conversation.customer?.avatar} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold truncate">{customerName}</h2>
              {conversation.subject && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  · {conversation.subject}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={conversation.status === 'active' ? 'success' : 'warning'} className="capitalize text-[10px] px-1.5 py-0">
                {conversation.status}
              </Badge>
              <span>{conversation.channel === 'chat' ? 'Chat' : conversation.channel === 'email' ? 'Email' : conversation.channel === 'phone' ? 'Phone' : 'API'}</span>
              <span>· {formatRelativeTime(conversation.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => resolveMutation.mutate()}
              isLoading={resolveMutation.isPending}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Resolve
            </Button>
            <Button size="sm" variant="outline">
              <UserPlus className="mr-1 h-4 w-4" />
              Transfer
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {conversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2 max-w-[80%]',
                msg.sender === 'agent' || msg.sender === 'ai'
                  ? 'ml-auto flex-row-reverse'
                  : '',
              )}
            >
              <div
                className={cn(
                  'rounded-lg px-3 py-2 text-sm',
                  msg.sender === 'agent'
                    ? 'bg-primary text-primary-foreground'
                    : msg.sender === 'ai'
                    ? 'bg-primary/10 text-foreground border border-primary/20'
                    : msg.sender === 'system'
                    ? 'bg-muted text-muted-foreground text-xs italic'
                    : 'bg-muted text-foreground',
                )}
              >
                {msg.sender === 'ai' && (
                  <div className="flex items-center gap-1 mb-1 text-xs text-primary">
                    <Bot className="h-3 w-3" />
                    <span>AI Suggestion</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className="mt-1 text-[10px] opacity-70 text-right">
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-3 border-t pt-3">
          <div className="flex gap-2 mb-2 overflow-x-auto">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                className="whitespace-nowrap rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors shrink-0"
                onClick={() => setNewMessage(reply)}
              >
                {reply.length > 25 ? reply.slice(0, 25) + '...' : reply}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              isLoading={sendMutation.isPending}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block w-80">
      <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
            <TabsTrigger value="chat" className="flex-1">Customer</TabsTrigger>
            <TabsTrigger value="copilot" className="flex-1">AI Copilot</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar size="lg" fallback={customerName.charAt(0)} src={conversation.customer?.avatar} />
                  <div>
                    <p className="font-medium">{customerName}</p>
                    <p className="text-xs text-muted-foreground">{conversation.customer?.email || 'No email'}</p>
                  </div>
                </div>

                {conversation.customer?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{conversation.customer.phone}</span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Conversation Info</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Channel</span>
                      <span className="capitalize">{conversation.channel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="success" className="capitalize text-[10px] px-1.5 py-0">
                        {conversation.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Messages</span>
                      <span>{conversation.messages.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{formatDate(conversation.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {conversation.metadata && Object.keys(conversation.metadata).length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Custom Data</p>
                    {Object.entries(conversation.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{key}</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="copilot">
            <div className="space-y-3">
              {copilotSuggestions.map((suggestion, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-primary mb-1">
                          {suggestion.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{suggestion.text}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="mt-2 w-full text-xs">
                      <Zap className="mr-1 h-3 w-3" />
                      Use Suggestion
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
