import {
  Controller,
  Get,
  Post,
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
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces';
import { DocumentsService } from './documents.service';
import { UserRole, DocumentStatus } from '@prisma/client';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        knowledgeBaseId: { type: 'string' },
        title: { type: 'string' },
        fileType: { type: 'string', enum: ['PDF', 'DOCX', 'TXT', 'CSV'] },
      },
    },
  })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 100 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('knowledgeBaseId') knowledgeBaseId: string,
    @Body('title') title: string,
    @Body('fileType') fileType?: string,
  ) {
    return this.documentsService.upload(file, knowledgeBaseId, title, fileType);
  }

  @Get()
  @ApiOperation({ summary: 'List documents' })
  findAll(
    @Query('knowledgeBaseId') knowledgeBaseId?: string,
    @Query('status') status?: DocumentStatus,
    @Query('fileType') fileType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.documentsService.findAll({ knowledgeBaseId, status, fileType, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  @Post(':id/reprocess')
  @ApiOperation({ summary: 'Reprocess document' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  reprocess(@Param('id') id: string) {
    return this.documentsService.reprocess(id);
  }
}
