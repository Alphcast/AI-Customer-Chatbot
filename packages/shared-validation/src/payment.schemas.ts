import { z } from 'zod';
import { PaymentProvider, SubscriptionPlan } from '@shared/types';

export const createSubscriptionSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
  provider: z.nativeEnum(PaymentProvider),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  annual: z.boolean().default(false),
});

export const createPaymentIntentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('USD'),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
