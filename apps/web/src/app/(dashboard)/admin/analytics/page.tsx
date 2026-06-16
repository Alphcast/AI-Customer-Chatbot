'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/stats-card';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import {
  BarChart3,
  MessageSquare,
  DollarSign,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const convOverTime = [
  { month: 'Jan', conversations: 4200, resolved: 3800 },
  { month: 'Feb', conversations: 4500, resolved: 4100 },
  { month: 'Mar', conversations: 5100, resolved: 4700 },
  { month: 'Apr', conversations: 4800, resolved: 4400 },
  { month: 'May', conversations: 5600, resolved: 5200 },
  { month: 'Jun', conversations: 6200, resolved: 5800 },
];

const revenueOverTime = [
  { month: 'Jan', revenue: 12400, subscriptions: 9800, overage: 2600 },
  { month: 'Feb', revenue: 13900, subscriptions: 10500, overage: 3400 },
  { month: 'Mar', revenue: 15200, subscriptions: 11200, overage: 4000 },
  { month: 'Apr', revenue: 14800, subscriptions: 11500, overage: 3300 },
  { month: 'May', revenue: 17500, subscriptions: 12800, overage: 4700 },
  { month: 'Jun', revenue: 19200, subscriptions: 14000, overage: 5200 },
];

const aiUsageData = [
  { month: 'Jan', aiMessages: 85000, tokens: 12500000 },
  { month: 'Feb', aiMessages: 92000, tokens: 13800000 },
  { month: 'Mar', aiMessages: 105000, tokens: 16200000 },
  { month: 'Apr', aiMessages: 98000, tokens: 14800000 },
  { month: 'May', aiMessages: 118000, tokens: 17500000 },
  { month: 'Jun', aiMessages: 127000, tokens: 19200000 },
];

const modelUsage = [
  { model: 'GPT-4', usage: 45 },
  { model: 'GPT-3.5', usage: 30 },
  { model: 'Claude 3', usage: 15 },
  { model: 'Other', usage: 10 },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide analytics and metrics
        </p>
      </div>

      <MetricsGrid>
        <StatsCard
          title="Total Conversations"
          value="30,400"
          icon={<MessageSquare className="h-5 w-5" />}
          trend={{ value: 14.2, isPositive: true, label: 'vs last 6 months' }}
        />
        <StatsCard
          title="Resolution Rate"
          value="92.3%"
          icon={<BarChart3 className="h-5 w-5" />}
          trend={{ value: 2.1, isPositive: true, label: 'improvement' }}
        />
        <StatsCard
          title="Total Revenue"
          value="$93,000"
          icon={<DollarSign className="h-5 w-5" />}
          trend={{ value: 18.5, isPositive: true, label: 'growth' }}
        />
        <StatsCard
          title="Active Users"
          value="3,842"
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 8.3, isPositive: true, label: 'vs last month' }}
        />
      </MetricsGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversations Over Time</CardTitle>
            <CardDescription>Monthly conversation and resolution volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={convOverTime}>
                  <defs>
                    <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="conversations"
                    stroke="hsl(var(--primary))"
                    fill="url(#convGradient)"
                    strokeWidth={2}
                    name="Conversations"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stroke="#22c55e"
                    fill="url(#resolvedGradient)"
                    strokeWidth={2}
                    name="Resolved"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Revenue from subscriptions and overage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="subscriptions" name="Subscriptions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="overage" name="Overage" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AI Usage Metrics</CardTitle>
            <CardDescription>AI message volume and token consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aiUsageData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs text-muted-foreground" />
                  <YAxis
                    yAxisId="left"
                    className="text-xs text-muted-foreground"
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    className="text-xs text-muted-foreground"
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="aiMessages"
                    name="AI Messages"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="tokens"
                    name="Tokens"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {modelUsage.map((m) => (
                <div key={m.model} className="rounded-lg border p-3 text-center">
                  <p className="text-sm font-medium">{m.model}</p>
                  <p className="mt-1 text-2xl font-bold">{m.usage}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
