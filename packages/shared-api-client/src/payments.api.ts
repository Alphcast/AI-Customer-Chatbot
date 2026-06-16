import { Payment, Subscription, ApiResponse } from '@shared/types';
import { apiClient } from './client';

export async function createPaymentIntent(data: {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const response = await apiClient.post<ApiResponse<{ clientSecret: string; paymentIntentId: string }>>('/payments/create-payment-intent', data);
  return response.data.data;
}

export async function createSubscription(data: {
  plan: string;
  provider: string;
  paymentMethodId: string;
  annual?: boolean;
}): Promise<Subscription> {
  const response = await apiClient.post<ApiResponse<Subscription>>('/payments/create-subscription', data);
  return response.data.data;
}

export async function cancelSubscription(data: { subscriptionId: string; reason?: string }): Promise<Subscription> {
  const response = await apiClient.post<ApiResponse<Subscription>>('/payments/cancel-subscription', data);
  return response.data.data;
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const response = await apiClient.get<ApiResponse<Subscription[]>>('/payments/subscriptions');
  return response.data.data;
}

export async function getPayments(): Promise<Payment[]> {
  const response = await apiClient.get<ApiResponse<Payment[]>>('/payments');
  return response.data.data;
}

export async function createPortalSession(): Promise<{ url: string }> {
  const response = await apiClient.post<ApiResponse<{ url: string }>>('/payments/portal');
  return response.data.data;
}
