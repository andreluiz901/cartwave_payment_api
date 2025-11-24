import { IPaymentProvider } from '@domain/ports/payment-provider.port';
import { IPaymentRepository } from '@domain/ports/payment-repository.port';
import { InMemoryPaymentRepository } from '@infra/db/in-memory-payment.repository';
import { CheckPaymentStatusUseCase } from '@/core/application/usecases/check-payment-status.usecase';
import { Payment } from '@core/domain/entities/payment.entity';
import { PaymentNotFoundError } from '@core/domain/errors/payment-not-found.error';
import { UniqueEntityId } from '@core/domain/entities/unique-entity-id';

describe('CheckPaymentStatusUseCase', () => {
  let provider: jest.Mocked<IPaymentProvider>;
  let repository: IPaymentRepository;
  let usecase: CheckPaymentStatusUseCase;

  beforeEach(() => {
    provider = {
      initiate: jest.fn(),
      getStatus: jest.fn(),
    };

    repository = new InMemoryPaymentRepository();
    usecase = new CheckPaymentStatusUseCase(provider, repository);
  });

  it('should return payment status from provider', async () => {
    const txId = new UniqueEntityId().toString();
    const payment = new Payment({
      amount: 100,
      currency: 'BRL',
      method: 'PIX',
      status: 'pending',
      productId: new UniqueEntityId().toString(),
      txId,
      createdAt: new Date(),
    });
    await repository.save(payment);

    provider.getStatus.mockResolvedValue({
      txId,
      status: 'processed',
    });

    const result = await usecase.execute({ paymentId: payment.id });

    expect(provider.getStatus).toHaveBeenCalledWith(txId);
    expect(result.paymentId).toBe(payment.id);
    expect(result.status).toBe('processed');
  });

  it('should update payment status in database when changed', async () => {
    const txId = new UniqueEntityId().toString();
    const payment = new Payment({
      amount: 100,
      currency: 'BRL',
      method: 'PIX',
      status: 'pending',
      productId: new UniqueEntityId().toString(),
      txId,
      createdAt: new Date(),
    });
    await repository.save(payment);

    provider.getStatus.mockResolvedValue({
      txId,
      status: 'processed',
    });

    await usecase.execute({ paymentId: payment.id });

    const updated = await repository.findById(payment.id);

    expect(updated!.status).toBeDefined();
    expect(updated!.status).toBe('processed');
  });

  it('should throw PaymentNotFoundError when payment does not exist', async () => {
    await expect(
      usecase.execute({ paymentId: new UniqueEntityId().toString() }),
    ).rejects.toThrow(PaymentNotFoundError);
  });

  it('should not call provider when payment already processed', async () => {
    const txId = new UniqueEntityId().toString();
    const payment = new Payment({
      amount: 100,
      currency: 'BRL',
      method: 'PIX',
      status: 'processed',
      productId: new UniqueEntityId().toString(),
      txId,
      createdAt: new Date(),
    });
    await repository.save(payment);

    const result = await usecase.execute({ paymentId: payment.id });

    expect(provider.getStatus).not.toHaveBeenCalled();
    expect(result.status).toBe('processed');
  });

  it('should return status without updating when provider returns pending', async () => {
    const productId = new UniqueEntityId().toString();
    const txId = new UniqueEntityId().toString();
    const payment = new Payment({
      amount: 100,
      currency: 'BRL',
      method: 'PIX',
      status: 'pending',
      productId,
      txId,
      createdAt: new Date(),
    });
    await repository.save(payment);

    provider.getStatus.mockResolvedValue({
      txId,
      status: 'processed',
    });

    const result = await usecase.execute({ paymentId: payment.id });

    expect(provider.getStatus).toHaveBeenCalledWith(txId);
    expect(result.paymentId).toBe(payment.id);
    expect(result.status).toBe('processed');

    const stored = await repository.findById(payment.id);
    expect(stored!.status).toBe('processed');
  });
});
