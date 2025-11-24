import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import nock from 'nock';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { setupTestDatabase } from '../../setup/testcontainers';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { AppModule } from '@/app.module';
import { DomainExceptionFilter } from '@infra/http/filters/domain-exception.filter';
import { UniqueEntityId } from '@core/domain/entities/unique-entity-id';
import { PrismaClient } from '@/generated/client';
import { PrismaService } from '@/infra/db/prisma/prisma.service';

interface PaymentResponse {
  paymentId: string;
  status: string;
}

describe('Payment API (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let container: StartedPostgreSqlContainer;
  let configService: ConfigService;
  let externalPaymentBaseUrl: string;

  beforeAll(async () => {
    const setupDatabase = await setupTestDatabase();
    prisma = setupDatabase.prisma;
    container = setupDatabase.container;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    configService = moduleFixture.get<ConfigService>(ConfigService);
    externalPaymentBaseUrl = configService.getOrThrow<string>(
      'PAYMENT_PROVIDER_URL',
    );

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
    if (prisma) await prisma.$disconnect();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    await prisma.payment.deleteMany();
    nock.cleanAll();
  });

  describe('POST /api/v1/payments', () => {
    it('should create payment and return pending status', async () => {
      const txId = new UniqueEntityId().toString();
      nock(externalPaymentBaseUrl)
        .post('/init-payment')
        .reply(200, { tx_id: txId, status: 'processed' });

      const productId = new UniqueEntityId().toString();
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .send({
          amount: 3452,
          currency: 'BRL',
          method: 'PAYPAL',
          product_id: productId,
        });

      expect(response.status).toBe(201);
      expect((response.body as PaymentResponse).paymentId).toBeDefined();
      expect((response.body as PaymentResponse).status).toBe('pending');

      const saved = await prisma.payment.findUnique({
        where: { id: (response.body as PaymentResponse).paymentId },
      });
      expect(saved).not.toBeNull();

      if (saved) {
        expect(saved.status).toBe('pending');
        expect(saved.productId).toBe(productId);
      }
    });

    it('should return 502 when provider fails', async () => {
      nock(externalPaymentBaseUrl).post('/init-payment').reply(500);

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .send({
          amount: 100,
          currency: 'BRL',
          method: 'PIX',
          product_id: new UniqueEntityId().toString(),
        });

      expect(response.status).toBe(502);
    });

    it('should return 400 when amount is negative', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .send({
          amount: -100,
          currency: 'BRL',
          method: 'PIX',
          product_id: new UniqueEntityId().toString(),
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when currency is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .send({
          amount: 100,
          currency: 'INVALID',
          method: 'PIX',
          product_id: new UniqueEntityId().toString(),
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/payments/:paymentId', () => {
    it('should return payment status', async () => {
      const txId = new UniqueEntityId().toString();

      nock(externalPaymentBaseUrl)
        .post('/init-payment')
        .reply(200, { tx_id: txId, status: 'processed' });

      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .send({
          amount: 100,
          currency: 'BRL',
          method: 'PIX',
          product_id: new UniqueEntityId().toString(),
        });

      const paymentId = (createResponse.body as PaymentResponse).paymentId;

      nock(externalPaymentBaseUrl)
        .get(`/list-payment/${txId}`)
        .reply(200, { tx_id: txId, status: 'processed' });

      const statusResponse = await request(app.getHttpServer()).get(
        `/api/v1/payments/${paymentId}`,
      );

      expect(statusResponse.status).toBe(200);
      expect((statusResponse.body as PaymentResponse).paymentId).toBe(
        paymentId,
      );
      expect((statusResponse.body as PaymentResponse).status).toBe('processed');
    });

    it('should return 404 when payment not found', async () => {
      const response = await request(app.getHttpServer()).get(
        `/api/v1/payments/${new UniqueEntityId().toString()}`,
      );

      expect(response.status).toBe(404);
    });

    it('should not call provider when payment already processed', async () => {
      const txId = new UniqueEntityId().toString();

      // creating payment
      nock(externalPaymentBaseUrl)
        .post('/init-payment')
        .reply(200, { tx_id: txId, status: 'processed' });

      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .send({
          amount: 100,
          currency: 'BRL',
          method: 'PIX',
          product_id: new UniqueEntityId().toString(),
        });

      const paymentId = (createResponse.body as PaymentResponse).paymentId;

      // Search provider and update to processed at DB
      nock(externalPaymentBaseUrl)
        .get(`/list-payment/${txId}`)
        .reply(200, { tx_id: txId, status: 'processed' });

      await request(app.getHttpServer()).get(`/api/v1/payments/${paymentId}`);

      // Returns directly from DB without calling provider
      // if provider call, it fails because no nock is setup
      const secondResponse = await request(app.getHttpServer()).get(
        `/api/v1/payments/${paymentId}`,
      );

      expect(secondResponse.status).toBe(200);
      expect((secondResponse.body as PaymentResponse).status).toBe('processed');
    });
  });
});
