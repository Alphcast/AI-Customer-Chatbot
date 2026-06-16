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
import { Eye, Ban, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '@/types';

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'agent', label: 'Agent' },
  { value: 'customer', label: 'Customer' },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      const res = await api.get(`/admin/users?${params.toString()}`);
      return res.data.data as User[];
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.patch(`/admin/users/${id}`, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User status updated');
      setModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to update user');
    },
  });

  const columns = [
    {
      key: 'name',
      header: 'User',
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
        <Badge variant={u.role === 'admin' ? 'default' : u.role === 'business_owner' ? 'info' : u.role === 'agent' ? 'warning' : 'secondary'}>
          {u.role.replace('_', ' ')}
        </Badge>
      ),
    },
    { key: 'isActive', header: 'Status', render: (u: User) => (
      <Badge variant={u.isActive ? 'success' : 'destructive'}>
        {u.isActive ? 'Active' : 'Disabled'}
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
            setSelectedUser(u);
            setModalOpen(true);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage all users on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>{data?.length || 0} users registered</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-48 pl-8"
                />
              </div>
              <Select
                options={roleOptions}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-36"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data || []}
            isLoading={isLoading}
            keyExtractor={(item: User) => item.id}
            searchValue={search}
            onSearch={setSearch}
            searchable
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg" fallback={getInitials(selectedUser.firstName, selectedUser.lastName)} src={selectedUser.avatar} />
              <div>
                <p className="text-lg font-medium">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge variant="default" className="mt-1 capitalize">
                  {selectedUser.role.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={selectedUser.isActive ? 'success' : 'destructive'} className="mt-1">
                  {selectedUser.isActive ? 'Active' : 'Disabled'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(selectedUser.updatedAt)}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {selectedUser.isActive ? (
                <Button
                  variant="destructive"
                  onClick={() =>
                    toggleStatusMutation.mutate({
                      id: selectedUser.id,
                      isActive: selectedUser.isActive,
                    })
                  }
                  isLoading={toggleStatusMutation.isPending}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Disable User
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() =>
                    toggleStatusMutation.mutate({
                      id: selectedUser.id,
                      isActive: selectedUser.isActive,
                    })
                  }
                  isLoading={toggleStatusMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Enable User
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
