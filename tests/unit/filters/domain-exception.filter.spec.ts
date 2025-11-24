import { DomainExceptionFilter } from '@infra/http/filters/domain-exception.filter';
import { PaymentNotFoundError } from '@core/domain/errors/payment-not-found.error';
import { ExternalProviderPaymentError } from '@core/domain/errors/external-provider-payment.error';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { InvalidUuidError } from '@core/domain/errors/invalid-uuid.error';
import { UniqueEntityId } from '@/core/domain/entities/unique-entity-id';

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let mockResponse: MockResponse;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new DomainExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should return 404 for PaymentNotFoundError', () => {
    const id = new UniqueEntityId().toString();
    const exception = new PaymentNotFoundError(id);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      message: `Payment with id ${id} not found`,
    });
  });

  it('should return 502 for ExternalProviderPaymentError', () => {
    const exception = new ExternalProviderPaymentError();

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_GATEWAY,
      error: 'Bad Gateway',
      message: 'Payment provider failed to process the request',
    });
  });

  it('should return 400 for InvalidUuidError', () => {
    const id = new UniqueEntityId().toString();
    const exception = new InvalidUuidError(id);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: `Invalid UUID: ${id}`,
    });
  });
});
