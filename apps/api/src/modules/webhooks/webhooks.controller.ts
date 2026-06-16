import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces';
import { WebhooksService } from './webhooks.service';
import { IncomingWebhookDto } from './dto/incoming-webhook.dto';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Post('incoming/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  handleIncoming(
    @Param('provider') provider: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.webhooksService.handleIncomingWebhook(provider, body, headers);
  }

  @Post('outgoing')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register an outgoing webhook' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  registerOutgoing(@Body() dto: RegisterWebhookDto, @CurrentUser() user: JwtPayload) {
    return this.webhooksService.registerOutgoingWebhook(dto, user);
  }

  @Get('outgoing')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List outgoing webhooks' })
  listOutgoing(@CurrentUser() user: JwtPayload) {
    return this.webhooksService.listOutgoingWebhooks(user);
  }

  @Patch('outgoing/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update outgoing webhook' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  updateOutgoing(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.webhooksService.updateOutgoingWebhook(id, dto, user);
  }

  @Delete('outgoing/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete outgoing webhook' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  deleteOutgoing(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.webhooksService.deleteOutgoingWebhook(id, user);
  }
}
