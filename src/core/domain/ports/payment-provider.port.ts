export interface PaymentProviderInput {
  money: {
    amount: number;
    currency: string;
  };
  payment_method: string;
  productId: string;
}

export interface PaymentProviderStatusResponse {
  txId: string;
  status: string;
}

export interface PaymentProviderResponse {
  status: string;
  txId: string;
}

export interface IPaymentProvider {
  initiate(input: PaymentProviderInput): Promise<PaymentProviderResponse>;
  getStatus(txId: string): Promise<PaymentProviderStatusResponse>;
}
