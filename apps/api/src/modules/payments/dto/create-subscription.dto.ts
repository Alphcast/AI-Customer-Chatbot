import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan, PaymentProvider } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiPropertyOptional({ enum: PaymentProvider, default: PaymentProvider.STRIPE })
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
