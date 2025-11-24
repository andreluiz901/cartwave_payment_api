import { IsIn, IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';
import {
  PaymentCurrency,
  PaymentMethod,
} from '@core/domain/entities/payment.entity';

export class CreatePaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsIn(['BRL', 'USD', 'EUR'])
  currency: PaymentCurrency;

  @IsString()
  @IsIn(['PIX', 'PAYPAL', 'CREDIT_CARD'])
  method: PaymentMethod;

  @IsUUID()
  product_id: string;
}
