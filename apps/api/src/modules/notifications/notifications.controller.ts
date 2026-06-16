import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification-query.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user' })
  findAll(@Query() query: NotificationQueryDto, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.findAll(user.sub, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAsRead(id, user.sub);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.remove(id, user.sub);
  }
}
