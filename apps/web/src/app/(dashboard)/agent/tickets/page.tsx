'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/dashboard/data-table';
import { formatRelativeTime } from '@/lib/utils';
import { Search, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Ticket, TicketStatus } from '@/types';

const statusColors: Record<TicketStatus, 'warning' | 'info' | 'success' | 'secondary'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'secondary',
};

const priorityColors = {
  low: 'secondary' as const,
  medium: 'default' as const,
  high: 'warning' as const,
  urgent: 'destructive' as const,
};

export default function AgentTicketsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['agent', 'tickets', search, statusFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      const res = await api.get(`/agent/tickets?${params.toString()}`);
      return res.data.data as Ticket[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TicketStatus }) =>
      api.patch(`/agent/tickets/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'tickets'] });
      toast.success('Ticket updated');
    },
    onError: () => toast.error('Failed to update ticket'),
  });

  const columns = [
    {
      key: 'title',
      header: 'Ticket',
      sortable: true,
      render: (t: Ticket) => (
        <div>
          <p className="text-sm font-medium">{t.title}</p>
          <p className="text-xs text-muted-foreground">{t.category || 'Uncategorized'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: Ticket) => (
        <select
          className="h-7 rounded-md border border-input bg-transparent px-2 text-xs"
          value={t.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) =>
            updateStatusMutation.mutate({
              id: t.id,
              status: e.target.value as TicketStatus,
            })
          }
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t: Ticket) => (
        <Badge variant={priorityColors[t.priority]} className="capitalize">
          {t.priority}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (t: Ticket) => formatRelativeTime(t.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t: Ticket) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (t.status !== 'resolved' && t.status !== 'closed') {
              updateStatusMutation.mutate({ id: t.id, status: 'resolved' });
            }
          }}
          disabled={t.status === 'resolved' || t.status === 'closed'}
        >
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Tickets</h1>
        <p className="text-sm text-muted-foreground">
          Tickets assigned to you
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Tickets</CardTitle>
              <CardDescription>{tickets?.length || 0} tickets assigned</CardDescription>
            </div>
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
                  { value: 'all', label: 'All Status' },
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-28"
              />
              <Select
                options={[
                  { value: 'all', label: 'All Priority' },
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-28"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={tickets || []}
            isLoading={isLoading}
            keyExtractor={(item: Ticket) => item.id}
            searchValue={search}
            onSearch={setSearch}
            searchable
            emptyMessage="No tickets assigned to you."
          />
        </CardContent>
      </Card>
    </div>
  );
}
