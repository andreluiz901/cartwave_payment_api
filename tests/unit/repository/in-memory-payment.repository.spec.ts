import { PaymentNotFoundError } from '@/core/domain/errors/payment-not-found.error';
import { InMemoryPaymentRepository } from '@/infra/db/in-memory-payment.repository';
import { Payment } from '@core/domain/entities/payment.entity';
import { UniqueEntityId } from '@core/domain/entities/unique-entity-id';

describe('InMemoryPaymentRepository', () => {
  let repository: InMemoryPaymentRepository;

  beforeEach(() => {
    repository = new InMemoryPaymentRepository();
  });

  it('should save a payment', async () => {
    const payment = new Payment({
      amount: 100,
      currency: 'BRL',
      method: 'PIX',
      status: 'pending',
      productId: new UniqueEntityId().toString(),
      txId: new UniqueEntityId().toString(),
      createdAt: new Date(),
    });

    await repository.save(payment);

    const found = await repository.findById(payment.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(payment.id);
  });

  it('should find a payment by id', async () => {
    const txId = new UniqueEntityId().toString();
    const payment = new Payment({
      amount: 200,
      currency: 'USD',
      method: 'PAYPAL',
      status: 'pending',
      productId: new UniqueEntityId().toString(),
      txId,
      createdAt: new Date(),
    });

    await repository.save(payment);

    const paymentFound = await repository.findById(payment.id);

    expect(paymentFound).not.toBeNull();

    if (paymentFound) {
      expect(paymentFound.amount).toBe(200);
      expect(paymentFound.currency).toBe('USD');
      expect(paymentFound.method).toBe('PAYPAL');
      expect(paymentFound.status).toBe('pending');
      expect(paymentFound.productId).toBe(payment.productId);
      expect(paymentFound.txId).toBe(txId);
    }
  });

  it('should return null when payment is not found', async () => {
    const result = await repository.findById(new UniqueEntityId().toString());
    expect(result).toBeNull();
  });

  it('should update an existing payment', async () => {
    const payment = new Payment({
      amount: 300,
      currency: 'EUR',
      method: 'CREDIT_CARD',
      status: 'pending',
      productId: new UniqueEntityId().toString(),
      txId: new UniqueEntityId().toString(),
      createdAt: new Date(),
    });

    await repository.save(payment);

    payment.markAsProcessed();
    await repository.update(payment);

    const updated = await repository.findById(payment.id);

    expect(updated).toBeDefined();

    if (updated) {
      expect(updated.status).toBe('processed');
      expect(updated.productId).toBe(payment.productId);
      expect(updated.txId).toBe(payment.txId);
    }
  });

  it('should throw PaymentNotFound when updating nonexistent payment', async () => {
    const payment = new Payment({
      amount: 10,
      currency: 'BRL',
      method: 'PIX',
      status: 'pending',
      productId: new UniqueEntityId().toString(),
      txId: new UniqueEntityId().toString(),
      createdAt: new Date(),
    });

    await expect(repository.update(payment)).rejects.toThrow(
      PaymentNotFoundError,
    );
  });

  it('should return all payments', async () => {
    const payment1 = new Payment({
      amount: 100,
      currency: 'BRL',
      method: 'PIX',
      status: 'pending',
      productId: new UniqueEntityId().toString(),
      txId: new UniqueEntityId().toString(),
      createdAt: new Date(),
    });

    const payment2 = new Payment({
      amount: 200,
      currency: 'USD',
      method: 'PAYPAL',
      status: 'processed',
      productId: new UniqueEntityId().toString(),
      txId: new UniqueEntityId().toString(),
      createdAt: new Date(),
    });

    await repository.save(payment1);
    await repository.save(payment2);

    const all = await repository.findAll();

    expect(all).toHaveLength(2);
  });

  it('should return empty array when no payments exist', async () => {
    const all = await repository.findAll();
    expect(all).toEqual([]);
  });
});
