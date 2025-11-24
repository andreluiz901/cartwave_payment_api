import { PaymentNotFoundError } from '@core/domain/errors/payment-not-found.error';
import { IPaymentProvider } from '@domain/ports/payment-provider.port';
import { IPaymentRepository } from '@domain/ports/payment-repository.port';
import { Injectable } from '@nestjs/common';

export interface CheckPaymentStatusInput {
  paymentId: string;
}

export interface CheckPaymentStatusOutput {
  paymentId: string;
  status: string;
}

@Injectable()
export class CheckPaymentStatusUseCase {
  constructor(
    private readonly provider: IPaymentProvider,
    private readonly repository: IPaymentRepository,
  ) {}

  async execute(
    input: CheckPaymentStatusInput,
  ): Promise<CheckPaymentStatusOutput> {
    const payment = await this.repository.findById(input.paymentId);

    if (!payment) {
      throw new PaymentNotFoundError(input.paymentId);
    }

    if (payment.status === 'processed') {
      return {
        paymentId: payment.id,
        status: payment.status,
      };
    }

    const providerResponse = await this.provider.getStatus(payment.txId);

    if (providerResponse.status === 'processed') {
      payment.markAsProcessed();
      await this.repository.update(payment);
    }

    return {
      paymentId: payment.id,
      status: providerResponse.status,
    };
  }
}
