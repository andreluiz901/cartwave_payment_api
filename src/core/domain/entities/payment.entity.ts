import { UniqueEntityId } from './unique-entity-id';

export type PaymentStatus = 'pending' | 'processed';
export type PaymentMethod = 'PAYPAL' | 'PIX' | 'CREDIT_CARD';
export type PaymentCurrency = 'BRL' | 'USD' | 'EUR';

export type PaymentProperties = {
  amount: number;
  currency: PaymentCurrency;
  method: PaymentMethod;
  status: PaymentStatus;
  productId: string;
  createdAt: Date;
  txId: string;
};

export class Payment {
  private readonly _id: UniqueEntityId;
  private readonly props: PaymentProperties;

  constructor(props: PaymentProperties, id?: UniqueEntityId) {
    this._id = id ?? new UniqueEntityId();
    this.props = {
      ...props,
      txId: props.txId,
      createdAt: props.createdAt ?? new Date(),
    };
  }

  get id(): string {
    return this._id.toString();
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): PaymentCurrency {
    return this.props.currency;
  }

  get method(): PaymentMethod {
    return this.props.method;
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get productId(): string {
    return this.props.productId;
  }

  get txId(): string {
    return this.props.txId;
  }

  markAsProcessed() {
    this.props.status = 'processed';
  }
}
