import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'clx123abc...' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.BUSINESS_OWNER })
  role: UserRole;

  @ApiProperty({ required: false, example: 'https://example.com/avatar.png' })
  avatar?: string;

  @ApiProperty({ required: false, example: 'clx456def...' })
  companyId?: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' })
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
