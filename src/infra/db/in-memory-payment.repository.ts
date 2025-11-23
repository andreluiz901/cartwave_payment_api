/* eslint-disable @typescript-eslint/require-await */
import { PaymentNotFoundError } from '@/core/domain/errors/payment-not-found.error';
import { Payment } from '@core/domain/entities/payment.entity';
import { IPaymentRepository } from '@domain/ports/payment-repository.port';

export class InMemoryPaymentRepository implements IPaymentRepository {
  private payments: Map<string, Payment> = new Map();

  async save(payment: Payment): Promise<void> {
    this.payments.set(payment.id, payment);
  }

  async update(payment: Payment): Promise<void> {
    if (!this.payments.has(payment.id)) {
      throw new PaymentNotFoundError(payment.id);
    }
    this.payments.set(payment.id, payment);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.payments.get(id) ?? null;
  }

  async findAll(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }
}
