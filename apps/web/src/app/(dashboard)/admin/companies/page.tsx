'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { DataTable } from '@/components/dashboard/data-table';
import { formatDate } from '@/lib/utils';
import { Eye, Ban, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Company } from '@/types';

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'companies', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('isActive', statusFilter === 'active' ? 'true' : 'false');
      const res = await api.get(`/admin/companies?${params.toString()}`);
      return res.data.data as Company[];
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.patch(`/admin/companies/${id}`, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
      toast.success('Company status updated');
      setModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to update company');
    },
  });

  const columns = [
    { key: 'name', header: 'Company', sortable: true },
    { key: 'industry', header: 'Industry' },
    { key: 'website', header: 'Website', render: (c: Company) => c.website ? (
      <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {c.website.replace(/https?:\/\//, '')}
      </a>
    ) : '-' },
    { key: 'isActive', header: 'Status', render: (c: Company) => (
      <Badge variant={c.isActive ? 'success' : 'secondary'}>
        {c.isActive ? 'Active' : 'Suspended'}
      </Badge>
    )},
    { key: 'createdAt', header: 'Created', render: (c: Company) => formatDate(c.createdAt) },
    { key: 'actions', header: 'Actions', render: (c: Company) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCompany(c);
            setModalOpen(true);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <p className="text-sm text-muted-foreground">
          Manage all companies on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Companies</CardTitle>
              <CardDescription>{data?.length || 0} companies registered</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-48 pl-8"
                />
              </div>
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data || []}
            isLoading={isLoading}
            keyExtractor={(item: Company) => item.id}
            searchValue={search}
            onSearch={setSearch}
            searchable
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedCompany?.name || 'Company Details'}
        size="lg"
      >
        {selectedCompany && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Industry</p>
                <p className="font-medium">{selectedCompany.industry || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <p className="font-medium">{selectedCompany.website || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={selectedCompany.isActive ? 'success' : 'secondary'}>
                  {selectedCompany.isActive ? 'Active' : 'Suspended'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(selectedCompany.createdAt)}</p>
              </div>
            </div>
            {selectedCompany.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1 text-sm">{selectedCompany.description}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {selectedCompany.isActive ? (
                <Button
                  variant="destructive"
                  onClick={() =>
                    toggleStatusMutation.mutate({
                      id: selectedCompany.id,
                      isActive: selectedCompany.isActive,
                    })
                  }
                  isLoading={toggleStatusMutation.isPending}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend Company
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() =>
                    toggleStatusMutation.mutate({
                      id: selectedCompany.id,
                      isActive: selectedCompany.isActive,
                    })
                  }
                  isLoading={toggleStatusMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reactivate Company
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
