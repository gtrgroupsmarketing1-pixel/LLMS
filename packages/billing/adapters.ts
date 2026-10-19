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

export class StripeAdapter implements PaymentProviderAdapter {
  readonly name = 'STRIPE' as const;
  constructor(private readonly secretKey: string) {}

  async validate(): Promise<boolean> {
    return !!this.secretKey;
  }

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', input.returnUrl + '?status=success');
    params.append('cancel_url', input.returnUrl + '?status=cancelled');
    params.append('client_reference_id', input.reference);
    
    const amountInCents = Math.round(input.amount * 100);
    params.append('line_items[0][price_data][currency]', input.currency.toLowerCase());
    params.append('line_items[0][price_data][product_data][name]', `Invoice ${input.reference}`);
    params.append('line_items[0][price_data][unit_amount]', amountInCents.toString());
    params.append('line_items[0][quantity]', '1');

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!res.ok) return { ok: false, error: data.error?.message ?? 'stripe_error' };
    
    return { ok: true, externalId: data.id, paymentUrl: data.url };
  }

  async capturePayment(_id: string) {
    return { ok: true };
  }

  async refundPayment(_id: string, _amount?: number) {
    return { ok: true }; 
  }
}

export class TelrAdapter implements PaymentProviderAdapter {
  readonly name = 'TELR' as const;
  constructor(
    private readonly storeId: string,
    private readonly authKey: string,
    private readonly testMode: boolean = true,
  ) {}

  async validate(): Promise<boolean> {
    return !!(this.storeId && this.authKey);
  }

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const payload = {
      method: 'create',
      store: this.storeId,
      authkey: this.authKey,
      order: {
        cartid: input.reference,
        test: this.testMode ? '1' : '0',
        amount: input.amount.toString(),
        currency: input.currency.toUpperCase(),
        description: `Invoice ${input.reference}`,
      },
      return: {
        authorised: input.returnUrl + '?status=success',
        declined: input.returnUrl + '?status=declined',
        cancelled: input.returnUrl + '?status=cancelled',
      },
    };

    const res = await fetch('https://secure.telr.com/gateway/order.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as { order?: { ref: string; url: string }; error?: { note: string } };
    if (data.error) return { ok: false, error: data.error.note };
    if (!data.order) return { ok: false, error: 'telr_no_order' };

    return { ok: true, externalId: data.order.ref, paymentUrl: data.order.url };
  }

  async capturePayment(_id: string) { return { ok: true }; }
  async refundPayment(_id: string, _amount?: number) { return { ok: true }; }
}

export class MockStripeAdapter extends StripeAdapter {
  constructor() { super('mock_key'); }
  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    return { ok: true, externalId: `mock-stripe-${Date.now()}`, paymentUrl: `${input.returnUrl}?mock_stripe=true` };
  }
  async capturePayment(_id: string) { return { ok: true }; }
  async refundPayment(_id: string) { return { ok: true }; }
}

export class MockTelrAdapter extends TelrAdapter {
  constructor() { super('mock_store', 'mock_auth'); }
  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    return { ok: true, externalId: `mock-telr-${Date.now()}`, paymentUrl: `${input.returnUrl}?mock_telr=true` };
  }
  async capturePayment(_id: string) { return { ok: true }; }
  async refundPayment(_id: string) { return { ok: true }; }
}

export function getPaymentAdapter(provider: string): PaymentProviderAdapter {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const telrStore = process.env.TELR_STORE_ID;
  const telrAuth = process.env.TELR_AUTH_KEY;

  switch (provider) {
    case 'STRIPE':
      return stripeKey ? new StripeAdapter(stripeKey) : new MockStripeAdapter();
    case 'TELR':
      return (telrStore && telrAuth) ? new TelrAdapter(telrStore, telrAuth, process.env.NODE_ENV !== 'production') : new MockTelrAdapter();
    default:
      return new MockStripeAdapter();
  }
}

/** @deprecated use getPaymentAdapter */
export function adapterFor(provider: string): PaymentProviderAdapter {
  return getPaymentAdapter(provider);
}
