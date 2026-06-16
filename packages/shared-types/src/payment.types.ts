export enum SubscriptionPlan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYSTACK = 'PAYSTACK',
  FLUTTERWAVE = 'FLUTTERWAVE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  CANCELED = 'CANCELED',
}

export interface Subscription {
  id: string;
  companyId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: PaymentProvider;
  providerSubscriptionId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  canceledAt?: string;
  seats: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  features: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  companyId: string;
  subscriptionId?: string;
  provider: PaymentProvider;
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  invoiceUrl?: string;
  receiptUrl?: string;
  paidAt?: string;
  refundedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
