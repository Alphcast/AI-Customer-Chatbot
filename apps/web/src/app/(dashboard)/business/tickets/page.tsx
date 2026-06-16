'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { DataTable } from '@/components/dashboard/data-table';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Eye, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Ticket, TicketStatus, TicketPriority } from '@/types';

const ticketSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

const statusColors: Record<TicketStatus, 'warning' | 'info' | 'success' | 'secondary'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'secondary',
};

const priorityColors: Record<TicketPriority, 'secondary' | 'default' | 'warning' | 'destructive'> = {
  low: 'secondary',
  medium: 'default',
  high: 'warning',
  urgent: 'destructive',
};

export default function BusinessTicketsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['business', 'tickets', search, statusFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      const res = await api.get(`/business/tickets?${params.toString()}`);
      return res.data.data as Ticket[];
    },
  });

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: '', description: '', priority: 'medium', category: '' },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TicketFormData) => api.post('/business/tickets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'tickets'] });
      toast.success('Ticket created');
      setCreateModalOpen(false);
      form.reset();
    },
    onError: () => toast.error('Failed to create ticket'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TicketStatus }) =>
      api.patch(`/business/tickets/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'tickets'] });
      toast.success('Ticket status updated');
    },
    onError: () => toast.error('Failed to update ticket'),
  });

  const columns = [
    { key: 'title', header: 'Title', sortable: true, render: (t: Ticket) => (
      <div>
        <p className="text-sm font-medium">{t.title}</p>
        <p className="text-xs text-muted-foreground">{t.category || 'Uncategorized'}</p>
      </div>
    )},
    { key: 'status', header: 'Status', render: (t: Ticket) => (
      <Badge variant={statusColors[t.status]} className="capitalize">
        {t.status.replace('_', ' ')}
      </Badge>
    )},
    { key: 'priority', header: 'Priority', render: (t: Ticket) => (
      <Badge variant={priorityColors[t.priority]} className="capitalize">
        {t.priority}
      </Badge>
    )},
    { key: 'createdAt', header: 'Created', render: (t: Ticket) => formatRelativeTime(t.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (t: Ticket) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTicket(t);
              setDetailModalOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Manage support tickets and escalations
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Tickets</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
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
                  { value: 'closed', label: 'Closed' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-32"
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
                className="w-32"
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
            emptyMessage="No tickets found."
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Ticket"
        description="Create a new support ticket"
        size="lg"
      >
        <form
          onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
        >
          <Input
            label="Title *"
            placeholder="Brief summary of the issue"
            error={form.formState.errors.title?.message}
            {...form.register('title')}
          />
          <Input
            label="Description *"
            placeholder="Detailed description of the issue..."
            error={form.formState.errors.description?.message}
            {...form.register('description')}
          />
          <Select
            label="Priority *"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
            {...form.register('priority')}
          />
          <Input
            label="Category"
            placeholder="e.g., Billing, Technical, Account"
            {...form.register('category')}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Ticket
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedTicket(null);
        }}
        title={selectedTicket?.title || 'Ticket Details'}
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">
                  <select
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                    value={selectedTicket.status}
                    onChange={(e) =>
                      updateStatusMutation.mutate({
                        id: selectedTicket.id,
                        status: e.target.value as TicketStatus,
                      })
                    }
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <Badge variant={priorityColors[selectedTicket.priority]} className="mt-1 capitalize">
                  {selectedTicket.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{selectedTicket.category || 'Uncategorized'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(selectedTicket.createdAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="mt-1 text-sm">{selectedTicket.description}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
