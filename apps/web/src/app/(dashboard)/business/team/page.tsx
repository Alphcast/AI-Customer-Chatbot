'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { DataTable } from '@/components/dashboard/data-table';
import { formatDate, getInitials } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Mail, Ban, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '@/types';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['agent', 'admin']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const roleColors: Record<string, 'default' | 'info' | 'warning' | 'secondary'> = {
  admin: 'default',
  business_owner: 'info',
  agent: 'warning',
};

export default function BusinessTeamPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const { data: team, isLoading } = useQuery({
    queryKey: ['business', 'team', search],
    queryFn: async () => {
      const params = search ? `?search=${search}` : '';
      const res = await api.get(`/business/team${params}`);
      return res.data.data as User[];
    },
  });

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'agent', firstName: '', lastName: '' },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteFormData) => api.post('/business/team/invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'team'] });
      toast.success('Team member invited');
      setInviteModalOpen(false);
      form.reset();
    },
    onError: () => toast.error('Failed to invite member'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/business/team/${id}`, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'team'] });
      toast.success('Member status updated');
    },
    onError: () => toast.error('Failed to update member'),
  });

  const columns = [
    {
      key: 'name',
      header: 'Member',
      render: (u: User) => (
        <div className="flex items-center gap-2">
          <Avatar size="sm" fallback={getInitials(u.firstName, u.lastName)} src={u.avatar} />
          <div>
            <p className="text-sm font-medium">
              {u.firstName} {u.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u: User) => (
        <Badge variant={roleColors[u.role] || 'secondary'} className="capitalize">
          {u.role.replace('_', ' ')}
        </Badge>
      ),
    },
    { key: 'isActive', header: 'Status', render: (u: User) => (
      <Badge variant={u.isActive ? 'success' : 'secondary'}>
        {u.isActive ? 'Active' : 'Inactive'}
      </Badge>
    )},
    { key: 'createdAt', header: 'Joined', render: (u: User) => formatDate(u.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (u: User) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            toggleStatusMutation.mutate({ id: u.id, isActive: u.isActive });
          }}
        >
          {u.isActive ? (
            <Ban className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          )}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team members and their roles
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={team || []}
            isLoading={isLoading}
            keyExtractor={(item: User) => item.id}
            searchValue={search}
            onSearch={setSearch}
            searchable
            emptyMessage="No team members yet. Invite your first team member."
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Team Member"
        description="Send an invitation to join your team"
        size="md"
      >
        <form
          onSubmit={form.handleSubmit((data) => inviteMutation.mutate(data))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              error={form.formState.errors.firstName?.message}
              {...form.register('firstName')}
            />
            <Input
              label="Last Name *"
              error={form.formState.errors.lastName?.message}
              {...form.register('lastName')}
            />
          </div>
          <Input
            label="Email *"
            type="email"
            placeholder="colleague@company.com"
            error={form.formState.errors.email?.message}
            {...form.register('email')}
          />
          <Select
            label="Role *"
            options={[
              { value: 'agent', label: 'Support Agent' },
              { value: 'admin', label: 'Admin' },
            ]}
            {...form.register('role')}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={inviteMutation.isPending}>
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
