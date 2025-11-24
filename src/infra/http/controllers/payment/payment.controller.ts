import { CheckPaymentStatusUseCase } from '@core/application/usecases/check-payment-status.usecase';
import { CreatePaymentDto } from '@infra/dtos/create-payment.dto';
import { Controller, Post, Body, HttpCode, Get, Param } from '@nestjs/common';
import { InitiatePaymentUseCase } from '@core/application/usecases/initiate-payment.usecase';

@Controller('api/v1/payments')
export class PaymentController {
  constructor(
    private readonly initiatePayment: InitiatePaymentUseCase,
    private readonly checkPaymentStatus: CheckPaymentStatusUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(@Body() body: CreatePaymentDto) {
    const result = await this.initiatePayment.execute({
      amount: body.amount,
      currency: body.currency,
      method: body.method,
      productId: body.product_id,
    });

    return {
      paymentId: result.paymentId,
      status: result.status,
    };
  }

  @Get(':paymentId')
  async getStatus(@Param('paymentId') paymentId: string) {
    const result = await this.checkPaymentStatus.execute({ paymentId });

    return {
      paymentId: result.paymentId,
      status: result.status,
    };
  }
}
