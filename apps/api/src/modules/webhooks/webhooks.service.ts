import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/database';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { JwtPayload } from '../../common/interfaces';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async handleIncomingWebhook(
    provider: string,
    body: any,
    headers: Record<string, string>,
  ): Promise<any> {
    this.logger.log(`Incoming webhook from ${provider}`);

    switch (provider) {
      case 'whatsapp':
        return this.handleWhatsAppWebhook(body);
      case 'telegram':
        return this.handleTelegramWebhook(body);
      case 'messenger':
        return this.handleMessengerWebhook(body);
      case 'instagram':
        return this.handleInstagramWebhook(body);
      default:
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
  }

  private async handleWhatsAppWebhook(body: any): Promise<any> {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) return { status: 'ok' };

    const from = message.from;
    const text = message.text?.body || '';
    const ts = message.timestamp ? new Date(parseInt(message.timestamp) * 1000) : new Date();

    const customer = await this.findOrCreateCustomerByExternalId(from, 'whatsapp');

    const conversation = await this.findOrCreateConversation(customer.id, customer.companyId, 'WHATSAPP');

    await this.prisma.message.create({
      data: {
        content: text,
        type: 'TEXT',
        conversationId: conversation.id,
        customerId: customer.id,
        createdAt: ts,
      },
    });

    return { status: 'ok' };
  }

  private async handleTelegramWebhook(body: any): Promise<any> {
    const message = body?.message;
    if (!message) return { status: 'ok' };

    const fromId = message.from?.id?.toString();
    const text = message.text || '';
    const chatId = message.chat?.id?.toString();

    if (!fromId) return { status: 'ok' };

    const customer = await this.findOrCreateCustomerByExternalId(fromId, 'telegram');

    const conversation = await this.findOrCreateConversation(customer.id, customer.companyId, 'TELEGRAM');

    await this.prisma.message.create({
      data: {
        content: text,
        type: 'TEXT',
        conversationId: conversation.id,
        customerId: customer.id,
      },
    });

    return { status: 'ok' };
  }

  private async handleMessengerWebhook(body: any): Promise<any> {
    if (body?.hub_challenge) {
      return parseInt(body.hub_challenge);
    }

    const entry = body?.entry?.[0];
    const messaging = entry?.messaging?.[0];
    if (!messaging?.message) return { status: 'ok' };

    const senderId = messaging.sender?.id;
    const text = messaging.message.text || '';

    if (!senderId) return { status: 'ok' };

    const customer = await this.findOrCreateCustomerByExternalId(senderId, 'messenger');

    const conversation = await this.findOrCreateConversation(customer.id, customer.companyId, 'MESSENGER');

    await this.prisma.message.create({
      data: {
        content: text,
        type: 'TEXT',
        conversationId: conversation.id,
        customerId: customer.id,
      },
    });

    return { status: 'ok' };
  }

  private async handleInstagramWebhook(body: any): Promise<any> {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) return { status: 'ok' };

    const from = message.from;
    const text = message.text?.body || '';

    const customer = await this.findOrCreateCustomerByExternalId(from, 'instagram');

    const conversation = await this.findOrCreateConversation(customer.id, customer.companyId, 'INSTAGRAM');

    await this.prisma.message.create({
      data: {
        content: text,
        type: 'TEXT',
        conversationId: conversation.id,
        customerId: customer.id,
      },
    });

    return { status: 'ok' };
  }

  async registerOutgoingWebhook(dto: RegisterWebhookDto, user: JwtPayload): Promise<any> {
    return this.prisma.apiKey.create({
      data: {
        name: dto.url,
        key: crypto.randomBytes(32).toString('hex'),
        companyId: user.companyId,
      },
    });
  }

  async listOutgoingWebhooks(user: JwtPayload): Promise<any[]> {
    return this.prisma.apiKey.findMany({
      where: { companyId: user.companyId, isActive: true },
      select: { id: true, name: true, key: true, lastUsedAt: true, createdAt: true, isActive: true },
    });
  }

  async updateOutgoingWebhook(id: string, dto: UpdateWebhookDto, user: JwtPayload): Promise<any> {
    const webhook = await this.prisma.apiKey.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    return this.prisma.apiKey.update({
      where: { id },
      data: {
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.secret && { key: dto.secret }),
        ...(dto.url && { name: dto.url }),
      },
    });
  }

  async deleteOutgoingWebhook(id: string, user: JwtPayload): Promise<void> {
    const webhook = await this.prisma.apiKey.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    await this.prisma.apiKey.delete({ where: { id } });
  }

  async sendWebhook(url: string, event: string, data: any, secret?: string): Promise<boolean> {
    try {
      const body = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'AICustomerChatbot-Webhook/1.0',
      };

      if (secret) {
        const signature = crypto
          .createHmac('sha256', secret)
          .update(body)
          .digest('hex');
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        this.logger.warn(`Webhook to ${url} returned ${response.status}`);
        return false;
      }

      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send webhook to ${url}: ${err.message}`);
      return false;
    }
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  private async findOrCreateCustomerByExternalId(
    externalId: string,
    provider: string,
  ): Promise<any> {
    const customer = await this.prisma.customer.findFirst({
      where: { externalId: `${provider}:${externalId}` },
    });

    if (customer) return customer;

    const company = await this.prisma.company.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!company) throw new HttpException('No active company found', HttpStatus.INTERNAL_SERVER_ERROR);

    return this.prisma.customer.create({
      data: {
        email: `${externalId}@${provider}.inbound`,
        firstName: `${provider}-${externalId.slice(0, 8)}`,
        lastName: 'Customer',
        externalId: `${provider}:${externalId}`,
        companyId: company.id,
      },
    });
  }

  private async findOrCreateConversation(
    customerId: string,
    companyId: string,
    channel: string,
  ): Promise<any> {
    const activeConversation = await this.prisma.conversation.findFirst({
      where: {
        customerId,
        companyId,
        status: { in: ['ACTIVE', 'WAITING'] as any },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeConversation) return activeConversation;

    return this.prisma.conversation.create({
      data: {
        customerId,
        companyId,
        channel: channel as any,
        status: 'ACTIVE',
      },
    });
  }
}
