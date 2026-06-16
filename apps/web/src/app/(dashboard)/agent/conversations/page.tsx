'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConversationList } from '@/components/dashboard/conversation-list';
import { Search } from 'lucide-react';
import type { Conversation } from '@/types';

export default function AgentConversationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [channelFilter, setChannelFilter] = useState('all');

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['agent', 'conversations', statusFilter, channelFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('status', statusFilter);
      if (channelFilter !== 'all') params.set('channel', channelFilter);
      if (search) params.set('search', search);
      const res = await api.get(`/agent/conversations?${params.toString()}`);
      return res.data.data as Conversation[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your assigned conversations
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs defaultValue="active" value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="waiting">Waiting</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40 pl-8"
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Channels' },
              { value: 'chat', label: 'Chat' },
              { value: 'email', label: 'Email' },
              { value: 'phone', label: 'Phone' },
            ]}
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="w-32"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <ConversationList
            conversations={conversations || []}
            onSelect={(id) => router.push(`/agent/conversations/${id}`)}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
