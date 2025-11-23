import { ExternalProviderPaymentError } from '@/core/domain/errors/external-provider-payment.error';
import {
  IPaymentProvider,
  PaymentProviderInput,
  PaymentProviderResponse,
  PaymentProviderStatusResponse,
} from '@domain/ports/payment-provider.port';
import { ConfigService } from '@nestjs/config';

interface PaymentResponse {
  status: string;
  tx_id: string;
}

export class ExternalPaymentProvider implements IPaymentProvider {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.getOrThrow<string>(
      'PAYMENT_PROVIDER_URL',
    );
  }
  async initiate(
    input: PaymentProviderInput,
  ): Promise<PaymentProviderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/init-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          money: {
            amount: input.money.amount,
            currency: input.money.currency,
          },
          payment_method: input.payment_method,
          product_id: input.productId,
        }),
      });

      if (!response.ok) {
        throw new ExternalProviderPaymentError();
      }

      const data = (await response.json()) as PaymentResponse;

      return {
        status: data.status,
        txId: data.tx_id,
      };
    } catch (error) {
      if (error instanceof ExternalProviderPaymentError) {
        throw error;
      }
      throw new ExternalProviderPaymentError();
    }
  }

  async getStatus(txId: string): Promise<PaymentProviderStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/list-payment/${txId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new ExternalProviderPaymentError(
          `Provider returned status ${response.status}`,
        );
      }

      const data = (await response.json()) as PaymentResponse;

      return {
        txId: data.tx_id,
        status: data.status,
      };
    } catch (error) {
      this.error(error);
    }
  }

  private error(error: any): never {
    if (error instanceof ExternalProviderPaymentError) {
      throw error;
    }
    throw new ExternalProviderPaymentError(
      'Failed to connect to payment provider',
    );
  }
}
