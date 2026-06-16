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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a new message' })
  create(@Body() dto: CreateMessageDto, @CurrentUser() user: JwtPayload) {
    const isCustomer = user.role === 'CUSTOMER';
    return this.messagesService.create(
      dto,
      isCustomer ? user.sub : undefined,
      !isCustomer ? user.sub : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single message' })
  findOne(@Param('id') id: string) {
    return this.messagesService.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a message' })
  remove(@Param('id') id: string) {
    return this.messagesService.softDelete(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.messagesService.markAsRead([id], user.sub);
  }

  @Post(':conversationId/files')
  @ApiOperation({ summary: 'Upload a file message' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  uploadFile(
    @Param('conversationId') conversationId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.uploadFile(conversationId, file);
  }
}
