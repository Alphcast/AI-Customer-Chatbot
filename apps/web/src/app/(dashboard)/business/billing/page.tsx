'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { DataTable } from '@/components/dashboard/data-table';
import { formatDate } from '@/lib/utils';
import {
  Check,
  X,
  CreditCard,
  Download,
  ArrowRight,
  Crown,
  Zap,
  Rocket,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    icon: <Zap className="h-6 w-6" />,
    features: [
      '1 AI agent',
      '500 conversations/month',
      'Basic analytics',
      'Email support',
    ],
    notIncluded: ['Custom branding', 'API access', 'Priority support'],
    popular: false,
  },
  {
    name: 'Starter',
    price: '$29',
    description: 'For growing businesses',
    icon: <Rocket className="h-6 w-6" />,
    features: [
      '3 AI agents',
      '5,000 conversations/month',
      'Advanced analytics',
      'Custom branding',
      'API access',
    ],
    notIncluded: ['Priority support', 'Dedicated account manager'],
    popular: true,
  },
  {
    name: 'Professional',
    price: '$99',
    description: 'For established teams',
    icon: <Crown className="h-6 w-6" />,
    features: [
      '10 AI agents',
      '25,000 conversations/month',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Priority support',
    ],
    notIncluded: ['Dedicated account manager'],
    popular: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    icon: <Sparkles className="h-6 w-6" />,
    features: [
      'Unlimited AI agents',
      'Unlimited conversations',
      'Enterprise analytics',
      'Custom branding',
      'API access',
      'Priority support',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    notIncluded: [],
    popular: false,
  },
];

const currentPlan = 'Starter';

const paymentMethods = [
  {
    id: '1',
    type: 'Visa',
    last4: '4242',
    expiry: '12/26',
    isDefault: true,
  },
];

const invoices = [
  { id: 'INV-001', amount: 29, status: 'paid', date: '2026-06-01', period: 'Jun 2026' },
  { id: 'INV-002', amount: 29, status: 'paid', date: '2026-05-01', period: 'May 2026' },
  { id: 'INV-003', amount: 29, status: 'paid', date: '2026-04-01', period: 'Apr 2026' },
  { id: 'INV-004', amount: 29, status: 'paid', date: '2026-03-01', period: 'Mar 2026' },
];

export default function BusinessBillingPage() {
  const [addPaymentModal, setAddPaymentModal] = useState(false);

  const invoiceColumns = [
    { key: 'id', header: 'Invoice' },
    { key: 'period', header: 'Period' },
    { key: 'amount', header: 'Amount', render: (inv: typeof invoices[0]) => `$${inv.amount}.00` },
    { key: 'status', header: 'Status', render: (inv: typeof invoices[0]) => (
      <Badge variant={inv.status === 'paid' ? 'success' : 'warning'} className="capitalize">
        {inv.status}
      </Badge>
    )},
    { key: 'date', header: 'Date', render: (inv: typeof invoices[0]) => formatDate(inv.date) },
    { key: 'actions', header: '', render: () => (
      <Button variant="ghost" size="sm">
        <Download className="h-4 w-4" />
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>You are on the <strong>{currentPlan}</strong> plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">$29</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <div className="mt-4 space-y-2">
              {plans
                .find((p) => p.name === currentPlan)
                ?.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {f}
                  </div>
                ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Change Plan
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Your default payment method</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {pm.type} ending in {pm.last4}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires {pm.expiry}
                      {pm.isDefault && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Default
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setAddPaymentModal(true)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Compare Plans</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.popular ? 'border-primary shadow-md' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge>Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="text-primary">{plan.icon}</div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && (
                    <span className="text-sm text-muted-foreground">/month</span>
                  )}
                </div>
                <div className="space-y-2">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <X className="h-3.5 w-3.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant={plan.popular ? 'default' : 'outline'}
                  className="w-full"
                  disabled={plan.name === currentPlan}
                >
                  {plan.name === currentPlan ? 'Current Plan' : 'Upgrade'}
                  {plan.name !== currentPlan && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>View and download past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={invoiceColumns}
            data={invoices}
            keyExtractor={(item: typeof invoices[0]) => item.id}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={addPaymentModal}
        onClose={() => setAddPaymentModal(false)}
        title="Add Payment Method"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success('Payment method added (demo)');
            setAddPaymentModal(false);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Card Number</label>
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  placeholder="4242 4242 4242 4242"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Expiry</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                placeholder="MM/YY"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">CVC</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                placeholder="123"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAddPaymentModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Card</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
