import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-intent')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe payment intent' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  createPaymentIntent(@Body() dto: CreatePaymentIntentDto, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.createPaymentIntent(dto, user);
  }

  @Post('create-subscription')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a subscription' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  createSubscription(@Body() dto: CreateSubscriptionDto, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.createSubscription(dto, user);
  }

  @Post('cancel-subscription')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel current subscription' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  cancelSubscription(@Body() dto: CancelSubscriptionDto, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.cancelSubscription(dto, user);
  }

  @Get('subscriptions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company subscriptions' })
  getSubscriptions(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.getSubscriptions(user);
  }

  @Get('subscriptions/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription details with usage' })
  getSubscription(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.getSubscription(id, user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List payments with pagination' })
  findAll(@Query() query: PaginationDto, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.getAll(query, user);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.getPayment(id, user);
  }

  @Post('portal')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe customer portal session' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  createPortalSession(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.createPortalSession(user);
  }

  @Public()
  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleStripeWebhook(body, signature);
  }

  @Public()
  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  handlePaystackWebhook(
    @Body() body: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    return this.paymentsService.handlePaystackWebhook(body, signature);
  }

  @Public()
  @Post('webhook/flutterwave')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  handleFlutterwaveWebhook(
    @Body() body: any,
    @Headers('verif-hash') signature: string,
  ) {
    return this.paymentsService.handleFlutterwaveWebhook(body, signature);
  }
}
