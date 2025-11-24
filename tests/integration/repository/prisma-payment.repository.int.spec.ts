import { PrismaPaymentRepository } from '@infra/db/prisma/prisma-payment.repository';
import { Payment } from '@core/domain/entities/payment.entity';
import { setupTestDatabase } from '../../setup/testcontainers';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { UniqueEntityId } from '@core/domain/entities/unique-entity-id';
import { PrismaClient } from '@/generated/client';

describe('PrismaPaymentRepository (integration)', () => {
  let prisma: PrismaClient;
  let container: StartedPostgreSqlContainer;
  let repo: PrismaPaymentRepository;

  beforeAll(async () => {
    const boot = await setupTestDatabase();
    prisma = boot.prisma;
    container = boot.container;

    repo = new PrismaPaymentRepository(prisma);
  });

  beforeEach(async () => {
    await prisma.payment.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  it('should save a payment successfully', async () => {
    const productId = new UniqueEntityId().toString();
    const txId = new UniqueEntityId().toString();

    const payment = new Payment({
      amount: 99,
      currency: 'BRL',
      method: 'PIX',
      status: 'pending',
      productId,
      txId,
      createdAt: new Date(),
    });

    await repo.save(payment);

    const found = await repo.findById(payment.id);

    expect(found).not.toBeNull();

    if (found) {
      expect(found.id).toBe(payment.id);
      expect(found.amount).toBe(99);
      expect(found.currency).toBe('BRL');
      expect(found.status).toBe('pending');
      expect(found.productId).toBe(productId);
      expect(found.txId).toBe(txId);
    }
  });

  it('should update an existing payment', async () => {
    const productId = new UniqueEntityId().toString();
    const txId = new UniqueEntityId().toString();
    const amount = 100;

    const payment = new Payment({
      amount,
      currency: 'BRL',
      method: 'PIX',
      status: 'pending',
      productId,
      txId,
      createdAt: new Date(),
    });

    await repo.save(payment);

    payment.markAsProcessed();
    await repo.update(payment);

    const found = await repo.findById(payment.id);

    expect(found).not.toBeNull();

    if (found) {
      expect(found.status).toBe('processed');
      expect(found.amount).toBe(amount);
      expect(found.txId).toBe(txId);
    }
  });

  it('should return null when payment does not exist', async () => {
    const found = await repo.findById(new UniqueEntityId().toString());
    expect(found).toBeNull();
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

    await repo.save(payment1);
    await repo.save(payment2);

    const all = await repo.findAll();

    expect(all).toHaveLength(2);
    expect(all.map((p) => p.id)).toContain(payment1.id);
    expect(all.map((p) => p.id)).toContain(payment2.id);
  });

  it('should return empty array when no payments exist', async () => {
    const all = await repo.findAll();
    expect(all).toEqual([]);
  });
});
