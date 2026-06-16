import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  create(@Body() dto: CreateConversationDto, @CurrentUser() user: JwtPayload) {
    return this.chatService.createConversation(dto, user);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations with filters' })
  findAll(@Query() query: ConversationQueryDto, @CurrentUser() user: JwtPayload) {
    return this.chatService.findAll(query, user);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation with messages' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chatService.findById(id, user);
  }

  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Update conversation' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.update(id, dto, user);
  }

  @Post('conversations/:id/assign')
  @ApiOperation({ summary: 'Assign agent to conversation' })
  @Roles(UserRole.SUPPORT_AGENT, UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  assignAgent(
    @Param('id') id: string,
    @Body('agentId') agentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.assignAgent(id, agentId, user);
  }

  @Post('conversations/:id/resolve')
  @ApiOperation({ summary: 'Resolve conversation' })
  @Roles(UserRole.SUPPORT_AGENT, UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  resolve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chatService.resolveConversation(id, user);
  }

  @Post('conversations/:id/handoff')
  @ApiOperation({ summary: 'Handoff conversation to human agent' })
  handoffToAgent(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chatService.handoffToAgent(id, user);
  }

  @Post('conversations/:id/return-to-ai')
  @ApiOperation({ summary: 'Return conversation to AI mode' })
  @Roles(UserRole.SUPPORT_AGENT, UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  returnToAi(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chatService.returnToAi(id, user);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages for conversation' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMessages(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.chatService.getMessages(id, { page: page || 1, limit: limit || 50 }, user);
  }
}
