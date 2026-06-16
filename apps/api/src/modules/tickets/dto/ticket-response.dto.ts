import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus, TicketPriority } from '@prisma/client';

class CustomerBrief {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiPropertyOptional() avatar?: string;
}

class AssigneeBrief {
  @ApiProperty() id: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional() avatar?: string;
}

class NoteSummary {
  @ApiProperty() id: string;
  @ApiProperty() content: string;
  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional() author?: AssigneeBrief;
}

class SlaInfo {
  @ApiPropertyOptional() deadline?: Date;
  @ApiProperty() isBreached: boolean;
  @ApiPropertyOptional() remainingHours?: number;
}

export class TicketResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty({ enum: TicketStatus }) status: TicketStatus;
  @ApiProperty({ enum: TicketPriority }) priority: TicketPriority;
  @ApiPropertyOptional() category?: string;
  @ApiPropertyOptional() slaDeadline?: Date;
  @ApiPropertyOptional() resolvedAt?: Date;
  @ApiPropertyOptional() closedAt?: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  @ApiProperty() companyId: string;
  @ApiProperty() customerId: string;
  @ApiPropertyOptional() assigneeId?: string;
  @ApiPropertyOptional() conversationId?: string;

  @ApiPropertyOptional({ type: CustomerBrief })
  customer?: CustomerBrief;

  @ApiPropertyOptional({ type: AssigneeBrief })
  assignee?: AssigneeBrief;

  @ApiPropertyOptional({ type: [NoteSummary] })
  internalNotes?: NoteSummary[];

  @ApiPropertyOptional({ type: SlaInfo })
  sla?: SlaInfo;
}
