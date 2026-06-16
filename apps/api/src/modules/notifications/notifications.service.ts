import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { JwtPayload, PaginatedResult } from '../../common/interfaces';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto): Promise<any> {
    const notification = await this.prisma.notification.create({
      data: {
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data || undefined,
        userId: dto.userId,
      },
    });

    return notification;
  }

  async findAll(userId: string, query: NotificationQueryDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, isRead } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (isRead !== undefined) where.isRead = isRead;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string): Promise<any> {
    const notification = await this.prisma.notification.findFirst({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { count: result.count };
  }

  async remove(id: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.notification.delete({ where: { id } });
  }
}
