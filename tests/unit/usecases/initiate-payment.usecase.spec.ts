import { InitiatePaymentUseCase } from '@core/application/usecases/initiate-payment.usecase';
import { Payment } from '@core/domain/entities/payment.entity';
import { UniqueEntityId } from '@core/domain/entities/unique-entity-id';
import { ExternalProviderPaymentError } from '@core/domain/errors/external-provider-payment.error';
import {
  IPaymentProvider,
  PaymentProviderResponse,
} from '@core/domain/ports/payment-provider.port';
import { IPaymentRepository } from '@core/domain/ports/payment-repository.port';
import { InMemoryPaymentRepository } from '@infra/db/in-memory-payment.repository';

describe('InitiatePaymentUseCase', () => {
  let provider: jest.Mocked<IPaymentProvider>;
  let repository: IPaymentRepository;
  let usecase: InitiatePaymentUseCase;

  beforeEach(() => {
    provider = {
      initiate: jest.fn(),
      getStatus: jest.fn(),
    };

    repository = new InMemoryPaymentRepository();
    usecase = new InitiatePaymentUseCase(provider, repository);
  });

  it('should initiate payment successfully', async () => {
    const productId = new UniqueEntityId().toString();
    const input = {
      amount: 150,
      currency: 'BRL' as const,
      method: 'PIX' as const,
      productId,
    };

    const txId = new UniqueEntityId().toString();
    provider.initiate.mockResolvedValue({
      status: 'processed',
      txId,
    });

    const result = await usecase.execute(input);

    expect(provider.initiate).toHaveBeenCalledWith({
      money: {
        amount: 150,
        currency: 'BRL',
      },
      payment_method: 'PIX',
      productId,
    });

    const stored = await repository.findById(result.paymentId);

    expect(stored).toBeDefined();

    if (stored) {
      expect(stored).toBeInstanceOf(Payment);
      expect(stored.amount).toBe(150);
      expect(stored.currency).toBe('BRL');
      expect(stored.method).toBe('PIX');
      expect(stored.status).toBe('pending');
      expect(stored.txId).toBe(txId);
      expect(stored.productId).toBe(productId);
      expect(stored.id).toBe(result.paymentId);
    }

    expect(result).toEqual({
      paymentId: result.paymentId,
      status: 'pending',
    });
  });

  describe('when provider fails', () => {
    it('should throw when provider fails', async () => {
      const input = {
        amount: 150,
        currency: 'BRL' as const,
        method: 'PIX' as const,
        productId: new UniqueEntityId().toString(),
      };

      provider.initiate.mockRejectedValue(new Error('Provider unavailable'));

      await expect(usecase.execute(input)).rejects.toThrow(
        'Provider unavailable',
      );
    });

    it('should throw when provider returns invalid status', async () => {
      const input = {
        amount: 150,
        currency: 'BRL' as const,
        method: 'PIX' as const,
        productId: new UniqueEntityId().toString(),
      };

      provider.initiate.mockResolvedValue({
        status: 'failed',
        txId: 'some-tx-id',
      });

      await expect(usecase.execute(input)).rejects.toThrow(
        ExternalProviderPaymentError,
      );
    });
    it('should not persist payment when provider fails', async () => {
      const input = {
        amount: 150,
        currency: 'BRL' as const,
        method: 'PIX' as const,
        productId: new UniqueEntityId().toString(),
      };

      provider.initiate.mockRejectedValue(new Error('Provider unavailable'));

      await expect(usecase.execute(input)).rejects.toThrow();

      const all = await repository.findAll();
      expect(all).toHaveLength(0);
    });

    it('should throw when provider returns null', async () => {
      const input = {
        amount: 150,
        currency: 'BRL' as const,
        method: 'PIX' as const,
        productId: new UniqueEntityId().toString(),
      };

      provider.initiate.mockResolvedValue(
        null as unknown as PaymentProviderResponse,
      );

      await expect(usecase.execute(input)).rejects.toThrow(
        ExternalProviderPaymentError,
      );
    });
  });
});
