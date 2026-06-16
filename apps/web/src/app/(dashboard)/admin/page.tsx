'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { StatsCard } from '@/components/dashboard/stats-card';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { DataTable } from '@/components/dashboard/data-table';
import { formatDate, getInitials } from '@/lib/utils';
import {
  Building2,
  Users,
  DollarSign,
  Zap,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Company, AgentPerformance, ConversationAnalytics } from '@/types';

const revenueData = [
  { month: 'Jan', revenue: 12400 },
  { month: 'Feb', revenue: 13900 },
  { month: 'Mar', revenue: 15200 },
  { month: 'Apr', revenue: 14800 },
  { month: 'May', revenue: 17500 },
  { month: 'Jun', revenue: 19200 },
];

const topAgents: AgentPerformance[] = [
  { agentId: '1', agentName: 'Support Bot Alpha', conversationsHandled: 1234, avgResponseTime: 45, customerSatisfaction: 4.8, resolutionRate: 94 },
  { agentId: '2', agentName: 'Sales Assistant', conversationsHandled: 987, avgResponseTime: 52, customerSatisfaction: 4.6, resolutionRate: 91 },
  { agentId: '3', agentName: 'Tech Support AI', conversationsHandled: 876, avgResponseTime: 38, customerSatisfaction: 4.9, resolutionRate: 96 },
  { agentId: '4', agentName: 'Billing Bot', conversationsHandled: 654, avgResponseTime: 41, customerSatisfaction: 4.7, resolutionRate: 93 },
  { agentId: '5', agentName: 'General Assistant', conversationsHandled: 543, avgResponseTime: 55, customerSatisfaction: 4.5, resolutionRate: 89 },
];

const companyColumns = [
  { key: 'name', header: 'Company', sortable: true },
  { key: 'industry', header: 'Industry' },
  { key: 'createdAt', header: 'Created', render: (c: Company) => formatDate(c.createdAt) },
  { key: 'isActive', header: 'Status', render: (c: Company) => (
    <Badge variant={c.isActive ? 'success' : 'secondary'}>
      {c.isActive ? 'Active' : 'Inactive'}
    </Badge>
  )},
];

export default function AdminOverviewPage() {
  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      const res = await api.get('/admin/companies?limit=5');
      return res.data.data as Company[];
    },
  });

  const { data: convData } = useQuery({
    queryKey: ['admin', 'conversations-over-time'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/conversations');
      return res.data.data as ConversationAnalytics[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide metrics and insights
        </p>
      </div>

      <MetricsGrid>
        <StatsCard
          title="Total Companies"
          value="248"
          icon={<Building2 className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true, label: 'vs last month' }}
        />
        <StatsCard
          title="Active Users"
          value="3,842"
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 8, isPositive: true, label: 'vs last month' }}
        />
        <StatsCard
          title="Monthly Revenue"
          value="$19,200"
          icon={<DollarSign className="h-5 w-5" />}
          trend={{ value: 9.7, isPositive: true, label: 'vs last month' }}
        />
        <StatsCard
          title="AI Messages"
          value="127.4K"
          icon={<Zap className="h-5 w-5" />}
          trend={{ value: 3.2, isPositive: false, label: 'vs last month' }}
        />
      </MetricsGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top AI Agents</CardTitle>
            <CardDescription>Best performing agents by conversation volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAgents.map((agent, i) => (
                <div key={agent.agentId} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{agent.agentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.conversationsHandled.toLocaleString()} conversations
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{agent.customerSatisfaction.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">CSAT</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Companies</CardTitle>
          <CardDescription>Latest companies registered on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={companyColumns}
            data={companies || []}
            isLoading={companiesLoading}
            keyExtractor={(item: Company) => item.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
