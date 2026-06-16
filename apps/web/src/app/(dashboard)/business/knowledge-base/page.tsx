'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable } from '@/components/dashboard/data-table';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Library,
  Upload,
  FileText,
  Search,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { KnowledgeBase, Document, DocumentStatus } from '@/types';

const kbSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
});

type KBFormData = z.infer<typeof kbSchema>;

const statusConfig: Record<DocumentStatus, { variant: 'success' | 'warning' | 'destructive'; label: string }> = {
  ready: { variant: 'success', label: 'Ready' },
  processing: { variant: 'warning', label: 'Processing' },
  failed: { variant: 'destructive', label: 'Failed' },
};

export default function BusinessKnowledgeBasePage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: kbs, isLoading } = useQuery({
    queryKey: ['business', 'knowledge-base'],
    queryFn: async () => {
      const res = await api.get('/business/knowledge-base');
      return res.data.data as KnowledgeBase[];
    },
  });

  const form = useForm<KBFormData>({
    resolver: zodResolver(kbSchema),
    defaultValues: { name: '', description: '' },
  });

  const createMutation = useMutation({
    mutationFn: async (data: KBFormData) => {
      return api.post('/business/knowledge-base', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'knowledge-base'] });
      toast.success('Knowledge base created');
      setCreateModalOpen(false);
      form.reset();
    },
    onError: () => toast.error('Failed to create knowledge base'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/business/knowledge-base/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'knowledge-base'] });
      toast.success('Knowledge base deleted');
    },
    onError: () => toast.error('Failed to delete knowledge base'),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ kbId, file }: { kbId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/business/knowledge-base/${kbId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'knowledge-base'] });
      toast.success('Document uploaded');
    },
    onError: () => toast.error('Upload failed'),
  });

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => {
        if (selectedKB) uploadMutation.mutate({ kbId: selectedKB.id, file });
      });
    },
    [selectedKB, uploadMutation],
  );

  const kbColumns = [
    {
      key: 'name',
      header: 'Knowledge Base',
      sortable: true,
      render: (kb: KnowledgeBase) => (
        <div className="flex items-center gap-2">
          <Library className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{kb.name}</p>
            {kb.description && (
              <p className="text-xs text-muted-foreground">{kb.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'documents',
      header: 'Documents',
      render: (kb: KnowledgeBase) => (
        <span className="text-sm">{kb.documents?.length || 0}</span>
      ),
    },
    { key: 'createdAt', header: 'Created', render: (kb: KnowledgeBase) => formatDate(kb.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (kb: KnowledgeBase) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedKB(kb);
            }}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this knowledge base?')) {
                deleteMutation.mutate(kb.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">
            Manage your knowledge sources and documents
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Knowledge Base
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={kbColumns}
            data={kbs || []}
            isLoading={isLoading}
            keyExtractor={(item: KnowledgeBase) => item.id}
            onRowClick={(item: KnowledgeBase) => setSelectedKB(item)}
            emptyMessage="No knowledge bases yet. Create one to get started."
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Knowledge Base"
        size="md"
      >
        <form
          onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
        >
          <Input
            label="Name *"
            placeholder="e.g., Product Documentation"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
          <Input
            label="Description"
            placeholder="Brief description of this knowledge base..."
            {...form.register('description')}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedKB}
        onClose={() => {
          setSelectedKB(null);
          setTestResult(null);
        }}
        title={selectedKB?.name || 'Knowledge Base'}
        size="xl"
      >
        {selectedKB && (
          <Tabs defaultValue="documents">
            <TabsList>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="test">Test Query</TabsTrigger>
            </TabsList>

            <TabsContent value="documents">
              <div className="space-y-2">
                {selectedKB.documents && selectedKB.documents.length > 0 ? (
                  selectedKB.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.fileType} · {formatRelativeTime(doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusConfig[doc.status]?.variant || 'secondary'}>
                        {doc.status === 'processing' && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        {doc.status === 'ready' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {doc.status === 'failed' && <XCircle className="mr-1 h-3 w-3" />}
                        {statusConfig[doc.status]?.label || doc.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No documents yet. Upload files to populate this knowledge base.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload">
              <div
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drag & drop files here, or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports PDF, DOCX, TXT, and Markdown files
                </p>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.docx,.txt,.md,.csv"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach((file) =>
                      uploadMutation.mutate({ kbId: selectedKB.id, file }),
                    );
                  }}
                />
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>(
                      'input[type="file"]',
                    );
                    input?.click();
                  }}
                >
                  Browse Files
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="test">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask a question about your knowledge base..."
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                  />
                  <Button
                    onClick={async () => {
                      if (!testQuery.trim()) return;
                      try {
                        const res = await api.post(
                          `/business/knowledge-base/${selectedKB.id}/query`,
                          { query: testQuery },
                        );
                        setTestResult(res.data.data.answer || 'No answer found.');
                      } catch {
                        toast.error('Query failed');
                      }
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Ask
                  </Button>
                </div>
                {testResult && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm font-medium mb-1">Answer:</p>
                    <p className="text-sm text-muted-foreground">{testResult}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </Modal>
    </div>
  );
}
