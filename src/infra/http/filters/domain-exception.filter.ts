import { ExternalProviderPaymentError } from '@core/domain/errors/external-provider-payment.error';
import { InvalidUuidError } from '@core/domain/errors/invalid-uuid.error';
import { PaymentNotFoundError } from '@core/domain/errors/payment-not-found.error';
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(PaymentNotFoundError, ExternalProviderPaymentError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof PaymentNotFoundError) {
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: exception.message,
      });
    }

    if (exception instanceof ExternalProviderPaymentError) {
      return response.status(HttpStatus.BAD_GATEWAY).json({
        statusCode: HttpStatus.BAD_GATEWAY,
        error: 'Bad Gateway',
        message: exception.message,
      });
    }

    if (exception instanceof InvalidUuidError) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: exception.message,
      });
    }
  }
}
