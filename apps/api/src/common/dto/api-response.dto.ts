import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  success: boolean;
  data: T;
  meta?: any;
  timestamp: string;
}

export class PaginationMeta {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty()
  success: boolean;

  data: T[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;

  @ApiProperty()
  timestamp: string;
}
