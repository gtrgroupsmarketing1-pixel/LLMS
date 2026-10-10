export interface SendTemplateInput {
  to: string;
  templateName: string;
  language: string;
  variables: Record<string, string>;
}

export interface SendResult {
  ok: boolean;
  metaMessageId?: string;
  error?: string;
}

export interface TemplateSubmitInput {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'SERVICE';
  language: string;
  bodyText: string;
  variables: string[];
}

export interface TemplateSubmitResult {
  ok: boolean;
  metaTemplateId?: string;
  status: 'PENDING' | 'REJECTED';
  error?: string;
}

export interface WhatsAppAdapter {
  validate(): Promise<boolean>;
  submitTemplate(input: TemplateSubmitInput): Promise<TemplateSubmitResult>;
  getTemplateStatus(metaTemplateId: string): Promise<{ status: string; reason?: string }>;
  sendTemplate(input: SendTemplateInput): Promise<SendResult>;
}

export class MockWhatsAppAdapter implements WhatsAppAdapter {
  private counter = 0;
  async validate(): Promise<boolean> {
    return true;
  }
  async submitTemplate(input: TemplateSubmitInput): Promise<TemplateSubmitResult> {
    if (input.bodyText.length < 10) {
      return { ok: false, status: 'REJECTED', error: 'body_too_short' };
    }
    return { ok: true, metaTemplateId: `mock-tpl-${++this.counter}`, status: 'PENDING' };
  }
  async getTemplateStatus(metaTemplateId: string) {
    return {
      status: metaTemplateId.includes('reject') ? 'REJECTED' : 'APPROVED',
    };
  }
  async sendTemplate(input: SendTemplateInput): Promise<SendResult> {
    if (!input.to.startsWith('+')) return { ok: false, error: 'invalid_phone' };
    return { ok: true, metaMessageId: `mock-msg-${++this.counter}` };
  }
}

export class CloudApiWhatsAppAdapter implements WhatsAppAdapter {
  constructor(
    private readonly phoneNumberId: string,
    private readonly accessToken: string,
    private readonly baseUrl = 'https://graph.facebook.com/v20.0',
  ) {}

  async validate(): Promise<boolean> {
    return !!(this.phoneNumberId && this.accessToken);
  }

  async submitTemplate(input: TemplateSubmitInput): Promise<TemplateSubmitResult> {
    const body = {
      name: input.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      category: input.category,
      language: input.language,
      components: [
        {
          type: 'BODY',
          text: input.bodyText,
          example: { body_text: [input.variables.map(() => 'sample')] },
        },
      ],
    };
    const res = await fetch(`${this.baseUrl}/${this.phoneNumberId}/message_templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { id?: string; error?: { message?: string } };
    if (!res.ok) {
      return { ok: false, status: 'REJECTED', error: data?.error?.message ?? 'submit_failed' };
    }
    return { ok: true, metaTemplateId: data.id, status: 'PENDING' };
  }

  async getTemplateStatus(metaTemplateId: string) {
    const res = await fetch(`${this.baseUrl}/${metaTemplateId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    const data = (await res.json()) as { status?: string; rejected_reason?: string };
    return { status: data.status ?? 'UNKNOWN', reason: data.rejected_reason };
  }

  async sendTemplate(input: SendTemplateInput): Promise<SendResult> {
    const body = {
      messaging_product: 'whatsapp',
      to: input.to.replace('+', ''),
      type: 'template',
      template: {
        name: input.templateName,
        language: { code: input.language },
        components:
          input.variables && Object.keys(input.variables).length
            ? [
                {
                  type: 'body',
                  parameters: Object.values(input.variables).map((v) => ({
                    type: 'text',
                    text: v,
                  })),
                },
              ]
            : undefined,
      },
    };
    const res = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      return { ok: false, error: data?.error?.message ?? 'send_failed' };
    }
    return { ok: true, metaMessageId: data.messages?.[0]?.id };
  }
}
