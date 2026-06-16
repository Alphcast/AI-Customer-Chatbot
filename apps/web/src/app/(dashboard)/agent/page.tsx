'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { StatsCard } from '@/components/dashboard/stats-card';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { ConversationList } from '@/components/dashboard/conversation-list';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Smile,
  ArrowRight,
} from 'lucide-react';
import type { Conversation, Ticket } from '@/types';

export default function AgentDashboardPage() {
  const router = useRouter();

  const { data: conversations, isLoading: convLoading } = useQuery({
    queryKey: ['agent', 'conversations', 'assigned'],
    queryFn: async () => {
      const res = await api.get('/agent/conversations?status=active');
      return res.data.data as Conversation[];
    },
  });

  const { data: tickets } = useQuery({
    queryKey: ['agent', 'tickets', 'pending'],
    queryFn: async () => {
      const res = await api.get('/agent/tickets?status=open');
      return res.data.data as Ticket[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agent Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome! Here are your assigned conversations and tasks.
        </p>
      </div>

      <MetricsGrid columns={4}>
        <StatsCard
          title="Active Conversations"
          value={conversations?.length || 0}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <StatsCard
          title="Resolved Today"
          value="12"
          icon={<CheckCircle2 className="h-5 w-5" />}
          trend={{ value: 3, isPositive: true, label: 'vs yesterday' }}
        />
        <StatsCard
          title="Avg Response Time"
          value="1.4m"
          icon={<Clock className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true, label: 'faster' }}
        />
        <StatsCard
          title="CSAT Score"
          value="4.9"
          icon={<Smile className="h-5 w-5" />}
          trend={{ value: 0.1, isPositive: true, label: 'this week' }}
        />
      </MetricsGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assigned Conversations</CardTitle>
                <CardDescription>Conversations needing your attention</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/agent/conversations')}
              >
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ConversationList
              conversations={conversations || []}
              onSelect={(id) => router.push(`/agent/conversations/${id}`)}
              isLoading={convLoading}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Tickets</CardTitle>
              <CardDescription>Open tickets assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              {tickets && tickets.length > 0 ? (
                <div className="space-y-2">
                  {tickets.slice(0, 5).map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/agent/tickets`)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(ticket.createdAt)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          ticket.priority === 'urgent'
                            ? 'destructive'
                            : ticket.priority === 'high'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="ml-2 capitalize"
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No pending tickets. Great job!
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Online Status</span>
                  <Badge variant="success">Online</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Today's Shift</span>
                  <span className="font-medium">9:00 AM - 5:00 PM</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Break Time</span>
                  <span className="font-medium">Not taken</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
