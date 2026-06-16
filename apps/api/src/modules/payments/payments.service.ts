import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/database';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { JwtPayload, PaginatedResult } from '../../common/interfaces';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  PaymentStatus,
  PaymentProvider,
} from '@prisma/client';

const PLAN_LIMITS: Record<SubscriptionPlan, { aiTokens: number; storage: number; seats: number }> = {
  [SubscriptionPlan.STARTER]: { aiTokens: 10000, storage: 512, seats: 1 },
  [SubscriptionPlan.PROFESSIONAL]: { aiTokens: 100000, storage: 2048, seats: 5 },
  [SubscriptionPlan.BUSINESS]: { aiTokens: 500000, storage: 10240, seats: 25 },
  [SubscriptionPlan.ENTERPRISE]: { aiTokens: 5000000, storage: 102400, seats: 100 },
};

const PLAN_PRICES: Record<SubscriptionPlan, Record<string, number>> = {
  [SubscriptionPlan.STARTER]: { USD: 0, NGN: 0 },
  [SubscriptionPlan.PROFESSIONAL]: { USD: 2900, NGN: 400000 },
  [SubscriptionPlan.BUSINESS]: { USD: 9900, NGN: 1400000 },
  [SubscriptionPlan.ENTERPRISE]: { USD: 29900, NGN: 4200000 },
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: any = null;
  private paystackSecret: string;
  private flutterwaveSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.paystackSecret = this.config.get('PAYSTACK_SECRET_KEY') || '';
    this.flutterwaveSecret = this.config.get('FLUTTERWAVE_SECRET_KEY') || '';
    this.initStripe();
  }

  private async initStripe() {
    const stripeKey = this.config.get('STRIPE_SECRET_KEY');
    if (stripeKey) {
      try {
        const Stripe = (await import('stripe')).default;
        this.stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' as any });
      } catch {
        this.logger.warn('Stripe not initialized - install stripe package');
      }
    }
  }

  async createPaymentIntent(dto: CreatePaymentIntentDto, user: JwtPayload): Promise<any> {
    if (!this.stripe) throw new HttpException('Payment provider not configured', HttpStatus.SERVICE_UNAVAILABLE);

    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const customer = await this.getOrCreateStripeCustomer(company);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: dto.amount,
      currency: dto.currency || 'usd',
      description: dto.description || '',
      customer: customer.id,
      metadata: { companyId: user.companyId },
    });

    await this.prisma.payment.create({
      data: {
        amount: dto.amount / 100,
        currency: (dto.currency || 'USD').toUpperCase(),
        status: PaymentStatus.PENDING,
        provider: PaymentProvider.STRIPE,
        providerPaymentId: paymentIntent.id,
        providerData: paymentIntent,
        description: dto.description,
        companyId: user.companyId,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  }

  async createSubscription(dto: CreateSubscriptionDto, user: JwtPayload): Promise<any> {
    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const activeSub = await this.prisma.subscription.findFirst({
      where: { companyId: user.companyId, status: SubscriptionStatus.ACTIVE },
    });
    if (activeSub) throw new BadRequestException('Company already has an active subscription');

    const provider = dto.provider || PaymentProvider.STRIPE;
    const limits = PLAN_LIMITS[dto.plan];
    const trialDays = dto.plan === SubscriptionPlan.STARTER ? 0 : 14;
    const trialEndsAt = trialDays > 0 ? new Date(Date.now() + trialDays * 86400000) : null;

    let providerSubscriptionId: string | null = null;
    let providerData: any = null;

    if (provider === PaymentProvider.STRIPE && this.stripe) {
      const stripeCustomer = await this.getOrCreateStripeCustomer(company);

      let priceId = this.config.get(`STRIPE_PRICE_${dto.plan}`);
      if (!priceId) {
        const price = await this.stripe.prices.create({
          unit_amount: PLAN_PRICES[dto.plan].USD,
          currency: 'usd',
          recurring: { interval: 'month' },
          product_data: { name: `${dto.plan} Plan` },
        });
        priceId = price.id;
      }

      const subscription = await this.stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        ...(trialEndsAt ? { trial_end: Math.floor(trialEndsAt.getTime() / 1000) } : {}),
        metadata: { companyId: user.companyId, plan: dto.plan },
      });

      providerSubscriptionId = subscription.id;
      providerData = subscription;
    }

    const sub = await this.prisma.subscription.create({
      data: {
        companyId: user.companyId,
        plan: dto.plan,
        status: SubscriptionStatus.ACTIVE,
        provider,
        providerSubscriptionId,
        seats: limits.seats,
        aiTokenLimit: limits.aiTokens,
        storageLimit: limits.storage,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt || new Date(Date.now() + 30 * 86400000),
        trialEndsAt,
        features: providerData?.items?.data?.map((i: any) => i.price?.id) || [],
      },
    });

    return sub;
  }

  async cancelSubscription(dto: CancelSubscriptionDto, user: JwtPayload): Promise<any> {
    const sub = await this.prisma.subscription.findFirst({
      where: { companyId: user.companyId, status: SubscriptionStatus.ACTIVE },
    });
    if (!sub) throw new NotFoundException('No active subscription found');

    if (sub.providerSubscriptionId && this.stripe) {
      try {
        await this.stripe.subscriptions.update(sub.providerSubscriptionId, {
          cancel_at_period_end: !dto.immediate,
        });
        if (dto.immediate) {
          await this.stripe.subscriptions.cancel(sub.providerSubscriptionId);
        }
      } catch (err: any) {
        this.logger.error(`Failed to cancel Stripe subscription: ${err.message}`);
      }
    }

    const updated = await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: dto.immediate ? SubscriptionStatus.CANCELED : SubscriptionStatus.ACTIVE,
        canceledAt: new Date(),
      },
    });

    return updated;
  }

  async getSubscriptions(user: JwtPayload): Promise<any[]> {
    return this.prisma.subscription.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' },
      include: { payments: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
  }

  async getSubscription(id: string, user: JwtPayload): Promise<any> {
    const sub = await this.prisma.subscription.findFirst({
      where: { id, companyId: user.companyId },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    const usage = await this.calculateUsage(sub);
    return { ...sub, usage };
  }

  async getAll(query: PaginationDto, user: JwtPayload): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where = { companyId: user.companyId };
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async getPayment(id: string, user: JwtPayload): Promise<any> {
    const payment = await this.prisma.payment.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async createPortalSession(user: JwtPayload): Promise<any> {
    if (!this.stripe) throw new HttpException('Payment provider not configured', HttpStatus.SERVICE_UNAVAILABLE);

    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const customer = await this.getOrCreateStripeCustomer(company);

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: this.config.get('APP_URL') || 'http://localhost:3000',
    });

    return { url: session.url };
  }

  async handleStripeWebhook(payload: any, signature: string): Promise<{ received: boolean }> {
    if (!this.stripe) throw new HttpException('Stripe not configured', HttpStatus.SERVICE_UNAVAILABLE);

    const endpointSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(
        typeof payload === 'string' ? payload : JSON.stringify(payload),
        signature,
        endpointSecret,
      );
    } catch {
      throw new HttpException('Invalid signature', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        await this.prisma.payment.updateMany({
          where: { providerPaymentId: pi.id },
          data: { status: PaymentStatus.SUCCEEDED, providerData: pi },
        });
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        await this.prisma.payment.updateMany({
          where: { providerPaymentId: pi.id },
          data: { status: PaymentStatus.FAILED, providerData: pi },
        });
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          const sub = await this.prisma.subscription.findFirst({
            where: { providerSubscriptionId: subscriptionId },
          });
          if (sub) {
            await this.prisma.subscription.update({
              where: { id: sub.id },
              data: {
                status: SubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(invoice.period_start * 1000),
                currentPeriodEnd: new Date(invoice.period_end * 1000),
              },
            });
            await this.prisma.payment.create({
              data: {
                amount: invoice.total / 100,
                currency: invoice.currency.toUpperCase(),
                status: PaymentStatus.SUCCEEDED,
                provider: PaymentProvider.STRIPE,
                providerPaymentId: invoice.id,
                providerData: invoice,
                description: `Invoice ${invoice.number}`,
                invoiceUrl: invoice.hosted_invoice_url,
                companyId: sub.companyId,
                subscriptionId: sub.id,
              },
            });
          }
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subData = event.data.object;
        await this.prisma.subscription.updateMany({
          where: { providerSubscriptionId: subData.id },
          data: {
            status: subData.status === 'active' ? SubscriptionStatus.ACTIVE
              : subData.status === 'past_due' ? SubscriptionStatus.PAST_DUE
              : subData.status === 'canceled' ? SubscriptionStatus.CANCELED
              : subData.status === 'expired' ? SubscriptionStatus.EXPIRED
              : SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(subData.current_period_start * 1000),
            currentPeriodEnd: new Date(subData.current_period_end * 1000),
          },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const subData = event.data.object;
        await this.prisma.subscription.updateMany({
          where: { providerSubscriptionId: subData.id },
          data: { status: SubscriptionStatus.CANCELED, canceledAt: new Date() },
        });
        break;
      }
    }

    return { received: true };
  }

  async handlePaystackWebhook(payload: any, signature: string): Promise<{ received: boolean }> {
    const computedHash = require('crypto')
      .createHmac('sha512', this.paystackSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (computedHash !== signature) {
      throw new HttpException('Invalid signature', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Paystack webhook: ${payload.event}`);

    switch (payload.event) {
      case 'charge.success': {
        const data = payload.data;
        await this.prisma.payment.create({
          data: {
            amount: data.amount / 100,
            currency: data.currency.toUpperCase(),
            status: PaymentStatus.SUCCEEDED,
            provider: PaymentProvider.PAYSTACK,
            providerPaymentId: data.id.toString(),
            providerData: data,
            description: data.metadata?.description || 'Paystack payment',
            companyId: data.metadata?.companyId || '',
          },
        });
        break;
      }
      case 'subscription.create':
      case 'subscription.disable': {
        this.logger.log(`Paystack subscription event: ${payload.event}`);
        break;
      }
    }

    return { received: true };
  }

  async handleFlutterwaveWebhook(payload: any, signature: string): Promise<{ received: boolean }> {
    const expectedHash = require('crypto')
      .createHmac('sha256', this.flutterwaveSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature && expectedHash !== signature) {
      throw new HttpException('Invalid signature', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Flutterwave webhook: ${payload.event}`);

    switch (payload.event) {
      case 'charge.completed': {
        const data = payload.data;
        if (data.status === 'successful') {
          await this.prisma.payment.create({
            data: {
              amount: data.amount,
              currency: data.currency,
              status: PaymentStatus.SUCCEEDED,
              provider: PaymentProvider.FLUTTERWAVE,
              providerPaymentId: data.id.toString(),
              providerData: data,
              description: data.metadata?.description || 'Flutterwave payment',
              companyId: data.metadata?.companyId || '',
            },
          });
        }
        break;
      }
      case 'subscription.cancelled': {
        this.logger.log(`Flutterwave subscription cancelled: ${payload.data?.id}`);
        break;
      }
    }

    return { received: true };
  }

  async calculateUsage(subscription: any): Promise<any> {
    const currentPeriodStart = subscription.currentPeriodStart;
    const currentPeriodEnd = subscription.currentPeriodEnd;

    const messagesThisPeriod = await this.prisma.message.count({
      where: {
        createdAt: { gte: currentPeriodStart, lte: currentPeriodEnd },
        conversation: { companyId: subscription.companyId },
      },
    });

    const aiMessages = await this.prisma.message.count({
      where: {
        createdAt: { gte: currentPeriodStart, lte: currentPeriodEnd },
        senderId: null,
        customerId: null,
        conversation: { companyId: subscription.companyId },
      },
    });

    return {
      messagesTotal: messagesThisPeriod,
      aiMessages,
      aiTokenUsageEstimate: aiMessages * 500,
      aiTokenLimit: subscription.aiTokenLimit,
      aiTokenUsagePercent: subscription.aiTokenLimit > 0
        ? Math.round((aiMessages * 500 / subscription.aiTokenLimit) * 10000) / 100
        : 0,
      storageUsed: 0,
      storageLimit: subscription.storageLimit,
      seatsUsed: await this.prisma.user.count({
        where: { companyId: subscription.companyId, role: { not: 'CUSTOMER' }, isActive: true },
      }),
      seatsLimit: subscription.seats,
    };
  }

  private async getOrCreateStripeCustomer(company: any): Promise<any> {
    const existingSub = await this.prisma.subscription.findFirst({
      where: { companyId: company.id, provider: PaymentProvider.STRIPE, providerSubscriptionId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });

    const stripeCustomerId = existingSub?.providerData?.customer;

    if (stripeCustomerId) {
      try {
        return await this.stripe.customers.retrieve(stripeCustomerId);
      } catch {
        // Customer not found, create new
      }
    }

    const customer = await this.stripe.customers.create({
      name: company.name,
      metadata: { companyId: company.id },
    });

    return customer;
  }
}
