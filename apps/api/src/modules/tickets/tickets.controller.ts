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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { CreateInternalNoteDto } from './dto/create-internal-note.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new ticket' })
  @Roles(UserRole.SUPPORT_AGENT, UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List tickets with pagination and filters' })
  findAll(@Query() query: TicketQueryDto, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket with internal notes' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.findById(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket' })
  @Roles(UserRole.SUPPORT_AGENT, UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a ticket' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.remove(id, user);
  }

  @Post(':id/notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add internal note to ticket' })
  @Roles(UserRole.SUPPORT_AGENT, UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  addNote(
    @Param('id') id: string,
    @Body() dto: CreateInternalNoteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketsService.addNote(id, dto, user);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get internal notes for a ticket' })
  getNotes(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.getNotes(id, user);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign ticket to an agent' })
  @Roles(UserRole.SUPPORT_AGENT, UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  assign(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketsService.assign(id, assigneeId, user);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve a ticket' })
  @Roles(UserRole.SUPPORT_AGENT, UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  resolve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.resolve(id, user);
  }
}
