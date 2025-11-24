import { IPaymentRepository } from '@domain/ports/payment-repository.port';
import {
  Payment,
  PaymentCurrency,
  PaymentMethod,
  PaymentStatus,
} from '@core/domain/entities/payment.entity';
import { UniqueEntityId } from '@core/domain/entities/unique-entity-id';
import { PrismaClient } from '@/generated/client';

interface PaymentData {
  id: string;
  amount: number;
  currency: PaymentCurrency;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
  productId: string;
  txId: string;
}

export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(payment: Payment): Promise<void> {
    await this.prisma.payment.create({
      data: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        productId: payment.productId,
        txId: payment.txId,
        createdAt: payment.createdAt,
      },
    });
  }

  async update(payment: Payment): Promise<void> {
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        txId: payment.txId,
      },
    });
  }

  async findById(id: string): Promise<Payment | null> {
    const data = await this.prisma.payment.findUnique({ where: { id } });
    if (!data) return null;

    return this.toDomain(data as PaymentData);
  }

  async findAll(): Promise<Payment[]> {
    const data = await this.prisma.payment.findMany();
    return data.map((item) => this.toDomain(item as PaymentData));
  }

  private toDomain(data: PaymentData): Payment {
    return new Payment(
      {
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        status: data.status,
        createdAt: data.createdAt,
        productId: data.productId,
        txId: data.txId,
      },
      new UniqueEntityId(data.id),
    );
  }
}
