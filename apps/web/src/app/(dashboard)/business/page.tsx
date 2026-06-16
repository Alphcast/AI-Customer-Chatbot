'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { StatsCard } from '@/components/dashboard/stats-card';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { ConversationList } from '@/components/dashboard/conversation-list';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  CheckCircle2,
  Smile,
  Bot,
  Plus,
  BookOpen,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import type { Conversation } from '@/types';

export default function BusinessOverviewPage() {
  const router = useRouter();

  const { data: conversations, isLoading: convLoading } = useQuery({
    queryKey: ['business', 'conversations', 'recent'],
    queryFn: async () => {
      const res = await api.get('/business/conversations?limit=8&status=active');
      return res.data.data as Conversation[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      <MetricsGrid columns={4}>
        <StatsCard
          title="Active Conversations"
          value="24"
          icon={<MessageSquare className="h-5 w-5" />}
          trend={{ value: 8, isPositive: true, label: 'vs yesterday' }}
        />
        <StatsCard
          title="Resolution Rate"
          value="94.2%"
          icon={<CheckCircle2 className="h-5 w-5" />}
          trend={{ value: 2.1, isPositive: true, label: 'improvement' }}
        />
        <StatsCard
          title="Customer Satisfaction"
          value="4.8"
          icon={<Smile className="h-5 w-5" />}
          trend={{ value: 0.3, isPositive: true, label: 'this week' }}
        />
        <StatsCard
          title="Active Agents"
          value="6"
          icon={<Bot className="h-5 w-5" />}
          trend={{ value: 2, isPositive: true, label: 'this month' }}
        />
      </MetricsGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Conversations</CardTitle>
                <CardDescription>Your most recent active conversations</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/business/conversations')}
              >
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ConversationList
              conversations={conversations || []}
              onSelect={(id) => router.push(`/business/conversations/${id}`)}
              isLoading={convLoading}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push('/business/agents')}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Agent
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push('/business/knowledge-base')}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                New Knowledge Base
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push('/business/team')}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Team Member
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Resolved</span>
                  <span className="font-medium">18</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Response Time</span>
                  <span className="font-medium">1.2m</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Escalations</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI Messages</span>
                  <span className="font-medium">847</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
