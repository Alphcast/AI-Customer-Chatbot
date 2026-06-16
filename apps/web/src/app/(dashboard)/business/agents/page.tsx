'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { DataTable } from '@/components/dashboard/data-table';
import { formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bot,
  Plus,
  Power,
  PowerOff,
  Settings,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Agent } from '@/types';

const agentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  personality: z.string().optional(),
  tone: z.string().optional(),
  modelProvider: z.string().min(1, 'Provider is required'),
  modelName: z.string().min(1, 'Model name is required'),
  temperature: z.coerce.number().min(0).max(2),
  maxTokens: z.coerce.number().min(100).max(32000),
  systemPrompt: z.string().optional(),
  welcomeMessage: z.string().optional(),
});

type AgentFormData = z.infer<typeof agentSchema>;

export default function BusinessAgentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: agents, isLoading } = useQuery({
    queryKey: ['business', 'agents'],
    queryFn: async () => {
      const res = await api.get('/business/agents');
      return res.data.data as Agent[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.patch(`/business/agents/${id}`, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'agents'] });
      toast.success('Agent status updated');
    },
    onError: () => toast.error('Failed to update agent'),
  });

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      description: '',
      personality: 'professional',
      tone: 'friendly',
      modelProvider: 'openai',
      modelName: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: '',
      welcomeMessage: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      return api.post('/business/agents', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'agents'] });
      toast.success('Agent created successfully');
      setCreateModalOpen(false);
      form.reset();
    },
    onError: () => toast.error('Failed to create agent'),
  });

  const columns = [
    {
      key: 'name',
      header: 'Agent',
      sortable: true,
      render: (a: Agent) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{a.name}</p>
            <p className="text-xs text-muted-foreground">{a.modelName}</p>
          </div>
        </div>
      ),
    },
    { key: 'personality', header: 'Personality', render: (a: Agent) => a.personality || '-' },
    {
      key: 'isActive',
      header: 'Status',
      render: (a: Agent) => (
        <Badge variant={a.isActive ? 'success' : 'secondary'}>
          {a.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    { key: 'createdAt', header: 'Created', render: (a: Agent) => formatDate(a.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (a: Agent) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/business/agents/${a.id}`);
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleMutation.mutate({ id: a.id, isActive: a.isActive });
            }}
          >
            {a.isActive ? (
              <PowerOff className="h-4 w-4 text-destructive" />
            ) : (
              <Power className="h-4 w-4 text-emerald-500" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-sm text-muted-foreground">
            Manage your AI support agents
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={agents || []}
            isLoading={isLoading}
            keyExtractor={(item: Agent) => item.id}
            onRowClick={(item: Agent) => router.push(`/business/agents/${item.id}`)}
            emptyMessage="No AI agents yet. Create your first agent to get started."
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Agent"
        description="Configure your AI support agent"
        size="xl"
      >
        <form
          onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Agent Name *"
                placeholder="e.g., Customer Support Bot"
                error={form.formState.errors.name?.message}
                {...form.register('name')}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Description"
                placeholder="What does this agent do?"
                {...form.register('description')}
              />
            </div>
            <Select
              label="Personality"
              options={[
                { value: 'professional', label: 'Professional' },
                { value: 'friendly', label: 'Friendly' },
                { value: 'casual', label: 'Casual' },
                { value: 'empathetic', label: 'Empathetic' },
                { value: 'humorous', label: 'Humorous' },
              ]}
              {...form.register('personality')}
            />
            <Select
              label="Tone"
              options={[
                { value: 'friendly', label: 'Friendly' },
                { value: 'formal', label: 'Formal' },
                { value: 'neutral', label: 'Neutral' },
                { value: 'enthusiastic', label: 'Enthusiastic' },
              ]}
              {...form.register('tone')}
            />
            <Select
              label="Model Provider *"
              options={[
                { value: 'openai', label: 'OpenAI' },
                { value: 'anthropic', label: 'Anthropic' },
                { value: 'google', label: 'Google AI' },
              ]}
              error={form.formState.errors.modelProvider?.message}
              {...form.register('modelProvider')}
            />
            <Select
              label="Model *"
              options={[
                { value: 'gpt-4', label: 'GPT-4' },
                { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                { value: 'claude-3-opus', label: 'Claude 3 Opus' },
                { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
                { value: 'gemini-pro', label: 'Gemini Pro' },
              ]}
              error={form.formState.errors.modelName?.message}
              {...form.register('modelName')}
            />
            <Input
              label="Temperature"
              type="number"
              step="0.1"
              {...form.register('temperature')}
            />
            <Input
              label="Max Tokens"
              type="number"
              {...form.register('maxTokens')}
            />
          </div>

          <Input
            label="System Prompt"
            placeholder="Instructions for the agent's behavior..."
            {...form.register('systemPrompt')}
          />
          <Input
            label="Welcome Message"
            placeholder="Message shown when a conversation starts..."
            {...form.register('welcomeMessage')}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Agent
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
