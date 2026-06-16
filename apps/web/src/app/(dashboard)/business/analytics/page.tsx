'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/stats-card';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Smile,
  TrendingUp,
  TrendingDown,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const conversationsOverTime = [
  { date: 'Mon', incoming: 45, resolved: 38 },
  { date: 'Tue', incoming: 52, resolved: 48 },
  { date: 'Wed', incoming: 48, resolved: 44 },
  { date: 'Thu', incoming: 61, resolved: 55 },
  { date: 'Fri', incoming: 55, resolved: 52 },
  { date: 'Sat', incoming: 32, resolved: 30 },
  { date: 'Sun', incoming: 28, resolved: 26 },
];

const channelData = [
  { channel: 'Chat', value: 65 },
  { channel: 'Email', value: 20 },
  { channel: 'Phone', value: 10 },
  { channel: 'API', value: 5 },
];

const COLORS = ['hsl(var(--primary))', '#f59e0b', '#22c55e', '#8b5cf6'];

const agentPerformance = [
  { name: 'Support Bot A', conversations: 423, csat: 4.8, avgTime: 45 },
  { name: 'Support Bot B', conversations: 356, csat: 4.6, avgTime: 52 },
  { name: 'Human Team', conversations: 189, csat: 4.9, avgTime: 120 },
];

const categoryBreakdown = [
  { category: 'Technical Issues', count: 245 },
  { category: 'Billing', count: 180 },
  { category: 'Account Support', count: 156 },
  { category: 'Product Questions', count: 134 },
  { category: 'Feature Requests', count: 89 },
];

export default function BusinessAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Detailed insights into your support operations
        </p>
      </div>

      <MetricsGrid>
        <StatsCard
          title="Total Conversations"
          value="321"
          icon={<MessageSquare className="h-5 w-5" />}
          trend={{ value: 12.5, isPositive: true, label: 'this week' }}
        />
        <StatsCard
          title="Resolution Rate"
          value="91.8%"
          icon={<CheckCircle2 className="h-5 w-5" />}
          trend={{ value: 3.2, isPositive: true, label: 'improvement' }}
        />
        <StatsCard
          title="Avg Response Time"
          value="1.2m"
          icon={<Clock className="h-5 w-5" />}
          trend={{ value: 15, isPositive: true, label: 'faster' }}
        />
        <StatsCard
          title="CSAT Score"
          value="4.7"
          icon={<Smile className="h-5 w-5" />}
          trend={{ value: 0.2, isPositive: true, label: 'this month' }}
        />
      </MetricsGrid>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
                <CardDescription>Daily conversation volume for this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={conversationsOverTime}>
                      <defs>
                        <linearGradient id="incomingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs text-muted-foreground" />
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
                        dataKey="incoming"
                        stroke="hsl(var(--primary))"
                        fill="url(#incomingGrad)"
                        strokeWidth={2}
                        name="Incoming"
                      />
                      <Area
                        type="monotone"
                        dataKey="resolved"
                        stroke="#22c55e"
                        fill="url(#resolvedGrad)"
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
                <CardTitle>Channel Distribution</CardTitle>
                <CardDescription>Conversations by channel type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ channel, percent }) =>
                          `${channel} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {channelData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>Key metrics by agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentPerformance.map((agent) => (
                  <div
                    key={agent.name}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.conversations} conversations
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium">{agent.csat.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">CSAT</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{agent.avgTime}s</p>
                        <p className="text-xs text-muted-foreground">Avg Time</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Categories</CardTitle>
              <CardDescription>Breakdown by topic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryBreakdown.map((cat) => {
                  const total = categoryBreakdown.reduce((s, c) => s + c.count, 0);
                  const pct = ((cat.count / total) * 100).toFixed(1);
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{cat.category}</span>
                        <span className="text-muted-foreground">
                          {cat.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
