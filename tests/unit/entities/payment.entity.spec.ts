import {
  Payment,
  PaymentProperties,
} from '@/core/domain/entities/payment.entity';
import { UniqueEntityId } from '@/core/domain/entities/unique-entity-id';

describe('Payment Entity', () => {
  const createPaymentProps = (
    overrides?: Partial<PaymentProperties>,
  ): PaymentProperties => ({
    amount: 100,
    currency: 'BRL',
    method: 'PAYPAL',
    status: 'pending',
    createdAt: new Date(),
    productId: new UniqueEntityId().toString(),
    txId: new UniqueEntityId().toString(),
    ...overrides,
  });

  const currencies = ['BRL', 'USD', 'EUR'] as const;
  const methods = ['PIX', 'PAYPAL', 'CREDIT_CARD'] as const;
  const statuses = ['pending', 'processed'] as const;

  it.each(currencies)('should create payment with currency %s', (currency) => {
    const payment = new Payment(createPaymentProps({ currency }));
    expect(payment.currency).toBe(currency);
  });

  it.each(methods)('should create payment with method %s', (method) => {
    const payment = new Payment(createPaymentProps({ method }));
    expect(payment.method).toBe(method);
  });

  it.each(statuses)('should create payment with status %s', (status) => {
    const payment = new Payment(createPaymentProps({ status }));
    expect(payment.status).toBe(status);
  });

  it('should create a payment with default values', () => {
    const baseProps = createPaymentProps();
    const payment = new Payment(baseProps);

    expect(payment.amount).toBe(100);
    expect(payment.currency).toBe('BRL');
    expect(payment.method).toBe('PAYPAL');
    expect(payment.status).toBe('pending');
    expect(payment.txId).toBe(baseProps.txId);
    expect(payment.createdAt).toBeInstanceOf(Date);
    expect(payment.createdAt).toBe(payment.createdAt);
    expect(payment.productId).toBe(baseProps.productId);
    expect(payment.id).toBeDefined();
  });

  it('should create a payment generating a createdAt date', () => {
    const payment = new Payment({
      amount: 100,
      currency: 'BRL',
      method: 'PAYPAL',
      status: 'pending',
      productId: new UniqueEntityId().toString(),
      txId: new UniqueEntityId().toString(),
    });

    expect(payment.createdAt).toBeDefined();
    expect(payment.createdAt).toBeInstanceOf(Date);
  });

  it('should accept an existing UniqueEntityId', () => {
    const id = new UniqueEntityId();
    const baseProps = createPaymentProps();
    const payment = new Payment(baseProps, id);

    expect(payment.id).toBe(id.toString());
  });

  it('should mark payment as processed', () => {
    const baseProps = createPaymentProps();
    const payment = new Payment(baseProps);

    expect(payment.status).toBe('pending');

    payment.markAsProcessed();

    expect(payment.status).toBe('processed');
    expect(payment.txId).toBe(baseProps.txId);
  });

  it('should update updatedAt when marking as processed', () => {
    const baseProps = createPaymentProps();
    const payment = new Payment(baseProps);
    const updatedAtBefore = payment.updatedAt;

    // Use a small delay to ensure time difference
    setTimeout(() => {
      payment.markAsProcessed();
      expect(payment.updatedAt.getTime()).toBeGreaterThanOrEqual(
        updatedAtBefore.getTime(),
      );
    }, 5);
  });

  it('should use provided createdAt', () => {
    const created = new Date('2025-11-20');
    const baseProps = createPaymentProps();

    const payment = new Payment({ ...baseProps, createdAt: created });

    expect(payment.createdAt).toBe(created);
  });

  it('should generate createdAt when not provided', () => {
    const before = new Date();
    const baseProps = createPaymentProps();

    const payment = new Payment(baseProps);
    const after = new Date();

    expect(payment.createdAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(payment.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should generate updatedAt when not provided', () => {
    const before = new Date();
    const baseProps = createPaymentProps();

    const payment = new Payment(baseProps);
    const after = new Date();

    expect(payment.updatedAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(payment.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should use provided updatedAt', () => {
    const updated = new Date('2025-11-24');
    const baseProps = createPaymentProps();

    const payment = new Payment({ ...baseProps, updatedAt: updated });

    expect(payment.updatedAt).toBe(updated);
  });
});
