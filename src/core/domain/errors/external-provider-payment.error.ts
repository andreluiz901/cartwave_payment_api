export class ExternalProviderPaymentError extends Error {
  constructor(message = 'Payment provider failed to process the request') {
    super(message);
    this.name = 'ExternalProviderPaymentError';
  }
}
