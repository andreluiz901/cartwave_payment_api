import type { IPaymentProvider } from '@/core/domain/ports/payment-provider.port';
import type { IPaymentRepository } from '@/core/domain/ports/payment-repository.port';
import {
  Payment,
  PaymentCurrency,
  PaymentMethod,
} from '@core/domain/entities/payment.entity';
import { ExternalProviderPaymentError } from '@core/domain/errors/external-provider-payment.error';
import { Injectable } from '@nestjs/common';

export interface InitiatePaymentInput {
  amount: number;
  currency: PaymentCurrency;
  method: PaymentMethod;
  productId: string;
}

export interface InitiatePaymentOutput {
  paymentId: string;
  status: string;
}

@Injectable()
export class InitiatePaymentUseCase {
  constructor(
    private readonly provider: IPaymentProvider,
    private readonly repository: IPaymentRepository,
  ) {}

  async execute(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const providerResponse = await this.provider.initiate({
      money: {
        amount: input.amount,
        currency: input.currency,
      },
      payment_method: input.method,
      productId: input.productId,
    });

    if (providerResponse?.status !== 'processed') {
      throw new ExternalProviderPaymentError();
    }

    const payment = new Payment({
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      status: 'pending',
      productId: input.productId,
      txId: providerResponse.txId,
      createdAt: new Date(),
    });

    await this.repository.save(payment);

    return {
      paymentId: payment.id,
      status: 'pending',
    };
  }
}
