export interface PaymentIntentInput {
  amount: number;
  currency: string;
  reference: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  ok: boolean;
  externalId?: string;
  paymentUrl?: string;
  error?: string;
}

export interface PaymentProviderAdapter {
  name: 'STRIPE' | 'TELR' | 'PAYTABS' | 'HYPERPAY' | 'MANUAL';
  validate(): Promise<boolean>;
  createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  capturePayment(externalId: string): Promise<{ ok: boolean; error?: string }>;
  refundPayment(externalId: string, amount?: number): Promise<{ ok: boolean; error?: string }>;
}

export class MockStripeAdapter implements PaymentProviderAdapter {
  readonly name = 'STRIPE' as const;
  async validate(): Promise<boolean> { return true; }
  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      ok: true,
      externalId: `stripe-${Date.now()}`,
      paymentUrl: `${input.returnUrl}?mock_stripe=${encodeURIComponent(input.reference)}`,
    };
  }
  async capturePayment(_id: string) { return { ok: true }; }
  async refundPayment(_id: string, _amt?: number) { return { ok: true }; }
}

export class MockTelrAdapter implements PaymentProviderAdapter {
  readonly name = 'TELR' as const;
  async validate(): Promise<boolean> { return true; }
  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      ok: true,
      externalId: `telr-${Date.now()}`,
      paymentUrl: `${input.returnUrl}?mock_telr=${encodeURIComponent(input.reference)}`,
    };
  }
  async capturePayment(_id: string) { return { ok: true }; }
  async refundPayment(_id: string, _amt?: number) { return { ok: true }; }
}

export class MockPayTabsAdapter implements PaymentProviderAdapter {
  readonly name = 'PAYTABS' as const;
  async validate(): Promise<boolean> { return true; }
  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      ok: true,
      externalId: `paytabs-${Date.now()}`,
      paymentUrl: `${input.returnUrl}?mock_paytabs=${encodeURIComponent(input.reference)}`,
    };
  }
  async capturePayment(_id: string) { return { ok: true }; }
  async refundPayment(_id: string, _amt?: number) { return { ok: true }; }
}

export function adapterFor(provider: string): PaymentProviderAdapter {
  switch (provider) {
    case 'TELR': return new MockTelrAdapter();
    case 'PAYTABS': return new MockPayTabsAdapter();
    case 'STRIPE': return new MockStripeAdapter();
    default: return new MockStripeAdapter();
  }
}
