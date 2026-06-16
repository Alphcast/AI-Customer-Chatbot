'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConversationList } from '@/components/dashboard/conversation-list';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Trash2, Plus, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Agent, Conversation } from '@/types';

const agentSettingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  personality: z.string().optional(),
  tone: z.string().optional(),
  language: z.string().optional(),
  modelProvider: z.string().min(1),
  modelName: z.string().min(1),
  temperature: z.coerce.number().min(0).max(2),
  maxTokens: z.coerce.number().min(100).max(32000),
  systemPrompt: z.string().optional(),
  welcomeMessage: z.string().optional(),
  isActive: z.boolean(),
});

type AgentSettingsForm = z.infer<typeof agentSettingsSchema>;

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState('settings');

  const { data: agent, isLoading } = useQuery({
    queryKey: ['business', 'agent', id],
    queryFn: async () => {
      const res = await api.get(`/business/agents/${id}`);
      return res.data.data as Agent;
    },
  });

  const { data: conversations } = useQuery({
    queryKey: ['business', 'agent', id, 'conversations'],
    queryFn: async () => {
      const res = await api.get(`/business/agents/${id}/conversations`);
      return res.data.data as Conversation[];
    },
  });

  const { data: knowledgeSources } = useQuery({
    queryKey: ['business', 'agent', id, 'knowledge'],
    queryFn: async () => {
      const res = await api.get(`/business/agents/${id}/knowledge`);
      return res.data.data as { id: string; name: string; documentCount: number }[];
    },
  });

  const form = useForm<AgentSettingsForm>({
    resolver: zodResolver(agentSettingsSchema),
    values: agent ? {
      name: agent.name,
      description: agent.description || '',
      personality: agent.personality || 'professional',
      tone: agent.tone || 'friendly',
      language: 'en',
      modelProvider: agent.modelProvider,
      modelName: agent.modelName,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      systemPrompt: agent.systemPrompt || '',
      welcomeMessage: agent.welcomeMessage || '',
      isActive: agent.isActive,
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AgentSettingsForm) => {
      return api.patch(`/business/agents/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'agent', id] });
      toast.success('Agent updated successfully');
    },
    onError: () => toast.error('Failed to update agent'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/business/agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'agents'] });
      toast.success('Agent deleted');
      router.push('/business/agents');
    },
    onError: () => toast.error('Failed to delete agent'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-64 w-full max-w-2xl rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Agent not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/business/agents')}>
          Back to Agents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/business/agents')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
            <Badge variant={agent.isActive ? 'success' : 'secondary'}>
              {agent.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {agent.modelProvider} / {agent.modelName}
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this agent?')) {
              deleteMutation.mutate();
            }
          }}
          isLoading={deleteMutation.isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <Tabs defaultValue="settings" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Sources</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="escalation">Escalation Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>Configure your agent's behavior and model settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Input
                      label="Agent Name"
                      error={form.formState.errors.name?.message}
                      {...form.register('name')}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      label="Description"
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
                    ]}
                    {...form.register('personality')}
                  />
                  <Select
                    label="Tone"
                    options={[
                      { value: 'friendly', label: 'Friendly' },
                      { value: 'formal', label: 'Formal' },
                      { value: 'neutral', label: 'Neutral' },
                    ]}
                    {...form.register('tone')}
                  />
                  <Select
                    label="Language"
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'fr', label: 'French' },
                      { value: 'de', label: 'German' },
                    ]}
                    {...form.register('language')}
                  />
                  <Select
                    label="Model Provider"
                    options={[
                      { value: 'openai', label: 'OpenAI' },
                      { value: 'anthropic', label: 'Anthropic' },
                      { value: 'google', label: 'Google AI' },
                    ]}
                    {...form.register('modelProvider')}
                  />
                  <Select
                    label="Model"
                    options={[
                      { value: 'gpt-4', label: 'GPT-4' },
                      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                      { value: 'claude-3-opus', label: 'Claude 3 Opus' },
                      { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
                    ]}
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
                  placeholder="System instructions for the agent..."
                  {...form.register('systemPrompt')}
                />
                <Input
                  label="Welcome Message"
                  placeholder="Initial greeting message..."
                  {...form.register('welcomeMessage')}
                />

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      {...form.register('isActive')}
                      className="rounded border-input"
                    />
                    Agent is active
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="submit" isLoading={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Knowledge Sources</CardTitle>
                  <CardDescription>Manage what this agent knows</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Source
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {knowledgeSources && knowledgeSources.length > 0 ? (
                <div className="space-y-2">
                  {knowledgeSources.map((ks) => (
                    <div
                      key={ks.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{ks.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ks.documentCount} documents
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No knowledge sources connected. Add a knowledge base to improve agent responses.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>Conversation History</CardTitle>
              <CardDescription>Conversations handled by this agent</CardDescription>
            </CardHeader>
            <CardContent>
              <ConversationList
                conversations={conversations || []}
                onSelect={(convId) => router.push(`/agent/conversations/${convId}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalation">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Escalation Rules</CardTitle>
                  <CardDescription>
                    Define when conversations should be escalated to human agents
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-sm text-muted-foreground">
                No escalation rules configured. Add rules to automatically escalate
                conversations based on keywords, sentiment, or duration.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
