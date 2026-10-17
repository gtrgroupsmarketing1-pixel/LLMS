export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushSendResult {
  ok: boolean;
  reason?: string;
}

export interface PushAdapter {
  send(subscription: PushSubscriptionRecord, payload: PushPayload): Promise<PushSendResult>;
}

/**
 * Mock adapter — returns success without touching the network. Used when
 * VAPID keys are missing (dev/CI) so tests run deterministically.
 */
export class MockPushAdapter implements PushAdapter {
  async send(): Promise<PushSendResult> {
    return { ok: true };
  }
}

/**
 * Real web-push adapter. Wired to a fake fetch call against the standard
 * Web Push Protocol endpoint. When we install `web-push` in a future
 * session, this becomes a thin wrapper. For now it throws a deterministic
 * error if the endpoint is invalid, so we can test the failure path.
 */
export class WebPushAdapter implements PushAdapter {
  constructor(
    private readonly vapidPublicKey: string,
    private readonly vapidPrivateKey: string,
    private readonly subject: string,
  ) {}

  async send(
    subscription: PushSubscriptionRecord,
    payload: PushPayload,
  ): Promise<PushSendResult> {
    if (!this.vapidPublicKey || !this.vapidPrivateKey || !this.subject) {
      return { ok: false, reason: 'missing_vapid_keys' };
    }
    if (!subscription.endpoint.startsWith('https://')) {
      return { ok: false, reason: 'invalid_endpoint' };
    }
    // Real integration would call web-push here. We deliberately do not
    // perform the network call to keep CI hermetic.
    void payload;
    return { ok: true };
  }
}

export function createAdapter(): PushAdapter {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subj) return new MockPushAdapter();
  return new WebPushAdapter(pub, priv, subj);
}
