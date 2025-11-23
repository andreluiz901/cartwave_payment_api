import nock from 'nock';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalProviderPaymentError } from '@core/domain/errors/external-provider-payment.error';
import { UniqueEntityId } from '@/core/domain/entities/unique-entity-id';
import { ExternalPaymentProvider } from '@/infra/providers/external-payment.provider';

describe('ExternalPaymentProvider', () => {
  let provider: ExternalPaymentProvider;
  let configService: ConfigService;
  let apiBaseUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
    }).compile();

    configService = moduleFixture.get<ConfigService>(ConfigService);
    apiBaseUrl = configService.getOrThrow<string>('PAYMENT_PROVIDER_URL');

    provider = new ExternalPaymentProvider(configService);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should call external API and return parsed response', async () => {
    const product_id = new UniqueEntityId().toString();
    const tx_id = new UniqueEntityId().toString();

    nock(apiBaseUrl)
      .post('/init-payment', {
        money: { amount: 100, currency: 'BRL' },
        payment_method: 'PIX',
        product_id,
      })
      .reply(200, {
        tx_id,
        status: 'processed',
      });

    const result = await provider.initiate({
      money: { amount: 100, currency: 'BRL' },
      payment_method: 'PIX',
      productId: product_id,
    });

    expect(result.txId).toBe(tx_id);
    expect(result.status).toBe('processed');
  });

  it('should throw when provider returns error', async () => {
    nock(apiBaseUrl).post('/init-payment').reply(500);

    await expect(
      provider.initiate({
        money: { amount: 100, currency: 'BRL' },
        payment_method: 'PIX',
        productId: new UniqueEntityId().toString(),
      }),
    ).rejects.toThrow(ExternalProviderPaymentError);
  });

  it('should throw when provider is unavailable', async () => {
    nock(apiBaseUrl).post('/init-payment').replyWithError('Connection refused');

    await expect(
      provider.initiate({
        money: { amount: 100, currency: 'BRL' },
        payment_method: 'PIX',
        productId: new UniqueEntityId().toString(),
      }),
    ).rejects.toThrow(ExternalProviderPaymentError);
  });

  it('should return payment status from external API', async () => {
    const txId = new UniqueEntityId().toString();

    nock(apiBaseUrl).get(`/list-payment/${txId}`).reply(200, {
      tx_id: txId,
      status: 'processed',
    });

    const result = await provider.getStatus(txId);

    expect(result.txId).toBe(txId);
    expect(result.status).toBe('processed');
  });

  it('should throw when provider returns error on getStatus', async () => {
    const txId = new UniqueEntityId().toString();

    nock(apiBaseUrl).get(`/list-payment/${txId}`).reply(500);

    await expect(provider.getStatus(txId)).rejects.toThrow(
      ExternalProviderPaymentError,
    );
  });

  it('should throw when provider is unavailable on getStatus', async () => {
    const txId = new UniqueEntityId().toString();

    nock(apiBaseUrl)
      .get(`/list-payment/${txId}`)
      .replyWithError('Connection refused');

    await expect(provider.getStatus(txId)).rejects.toThrow(
      ExternalProviderPaymentError,
    );
  });

  it('should re-throw ExternalProviderPaymentError from initiate', async () => {
    nock(apiBaseUrl).post('/init-payment').reply(500);

    await expect(
      provider.initiate({
        money: { amount: 100, currency: 'BRL' },
        payment_method: 'PIX',
        productId: new UniqueEntityId().toString(),
      }),
    ).rejects.toThrow(ExternalProviderPaymentError);
  });

  it('should wrap network error in ExternalProviderPaymentError from initiate', async () => {
    nock(apiBaseUrl).post('/init-payment').replyWithError('Network error');

    await expect(
      provider.initiate({
        money: { amount: 100, currency: 'BRL' },
        payment_method: 'PIX',
        productId: new UniqueEntityId().toString(),
      }),
    ).rejects.toThrow(ExternalProviderPaymentError);
  });
});
