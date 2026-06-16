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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { QueryKnowledgeBaseDto } from './dto/query-knowledge-base.dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Knowledge Base')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('knowledge-bases')
export class KnowledgeBaseController {
  constructor(private readonly kbService: KnowledgeBaseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a knowledge base' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateKnowledgeBaseDto) {
    return this.kbService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List knowledge bases for company' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.kbService.findAll(user.companyId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get knowledge base with documents' })
  findOne(@Param('id') id: string) {
    return this.kbService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update knowledge base' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: { name?: string; description?: string; isActive?: boolean }) {
    return this.kbService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete knowledge base' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.kbService.remove(id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Add document to knowledge base' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  addDocument(
    @Param('id') id: string,
    @Body() dto: { title: string; fileType: string; fileUrl?: string; content?: string },
  ) {
    return this.kbService.addDocument(id, dto.title, dto.fileType, dto.fileUrl, dto.content);
  }

  @Post(':id/query')
  @ApiOperation({ summary: 'Query knowledge base with semantic search' })
  query(@Param('id') id: string, @Body() dto: QueryKnowledgeBaseDto) {
    return this.kbService.query(id, dto);
  }
}
