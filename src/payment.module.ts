import { Module } from '@nestjs/common';
import { InitiatePaymentUseCase } from './core/application/usecases/initiate-payment.usecase';
import { PrismaPaymentRepository } from './infra/db/prisma/prisma-payment.repository';
import { ExternalPaymentProvider } from './infra/providers/external-payment.provider';
import { PaymentController } from '@infra/http/controllers/payment/payment.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CheckPaymentStatusUseCase } from '@core/application/usecases/check-payment-status.usecase';
import { PrismaService } from './infra/db/prisma/prisma.service';
import { IPaymentProvider } from './core/domain/ports/payment-provider.port';
import { IPaymentRepository } from './core/domain/ports/payment-repository.port';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentController],
  providers: [
    PrismaService,
    {
      provide: 'IPaymentRepository',
      useFactory: (prisma: PrismaService) =>
        new PrismaPaymentRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IPaymentProvider',
      useFactory: (configService: ConfigService) =>
        new ExternalPaymentProvider(configService),
      inject: [ConfigService],
    },
    {
      provide: InitiatePaymentUseCase,
      useFactory: (provider: IPaymentProvider, repo: IPaymentRepository) =>
        new InitiatePaymentUseCase(provider, repo),
      inject: ['IPaymentProvider', 'IPaymentRepository'],
    },
    {
      provide: CheckPaymentStatusUseCase,
      useFactory: (provider: IPaymentProvider, repo: IPaymentRepository) =>
        new CheckPaymentStatusUseCase(provider, repo),
      inject: ['IPaymentProvider', 'IPaymentRepository'],
    },
  ],
})
export class PaymentModule {}
