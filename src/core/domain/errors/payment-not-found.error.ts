export class PaymentNotFoundError extends Error {
  constructor(id?: string) {
    super(`Payment with id ${id} not found`);
    this.name = 'PaymentNotFound';
  }
}
