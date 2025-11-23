import { Payment } from '../entities/payment.entity';

export interface IPaymentRepository {
  save(payment: Payment): Promise<void>;
  update(payment: Payment): Promise<void>;
  findById(id: string): Promise<Payment | null>;
  findAll(): Promise<Payment[]>;
}
