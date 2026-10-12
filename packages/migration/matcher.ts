import type { ErpCustomer } from '@lmms/ingestion';

export type MatchResult =
  | { status: 'MATCHED_PHONE'; erpExternalId: string; confidence: number }
  | { status: 'MATCHED_EMAIL'; erpExternalId: string; confidence: number }
  | { status: 'UNMATCHED' }
  | { status: 'AMBIGUOUS'; candidates: string[] };

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+')) return '+' + digits.slice(1).replace(/\D/g, '');
  if (digits.startsWith('00')) return '+' + digits.slice(2);
  return '+' + digits;
}

function normalizeEmail(raw?: string | null): string | null {
  if (!raw) return null;
  const e = raw.trim().toLowerCase();
  return e || null;
}

export function matchCustomerToErp(
  lmms: { phone: string; email: string | null },
  erpIndex: {
    byPhone: Map<string, ErpCustomer[]>;
    byEmail: Map<string, ErpCustomer[]>;
  },
): MatchResult {
  const phone = normalizePhone(lmms.phone);
  const phoneMatches = erpIndex.byPhone.get(phone) ?? [];

  if (phoneMatches.length === 1) {
    return { status: 'MATCHED_PHONE', erpExternalId: phoneMatches[0].externalId, confidence: 100 };
  }
  if (phoneMatches.length > 1) {
    return { status: 'AMBIGUOUS', candidates: phoneMatches.map((m) => m.externalId) };
  }

  const email = normalizeEmail(lmms.email);
  if (email) {
    const emailMatches = erpIndex.byEmail.get(email) ?? [];
    if (emailMatches.length === 1) {
      return { status: 'MATCHED_EMAIL', erpExternalId: emailMatches[0].externalId, confidence: 80 };
    }
    if (emailMatches.length > 1) {
      return { status: 'AMBIGUOUS', candidates: emailMatches.map((m) => m.externalId) };
    }
  }

  return { status: 'UNMATCHED' };
}

export function buildErpIndex(customers: ErpCustomer[]): {
  byPhone: Map<string, ErpCustomer[]>;
  byEmail: Map<string, ErpCustomer[]>;
} {
  const byPhone = new Map<string, ErpCustomer[]>();
  const byEmail = new Map<string, ErpCustomer[]>();
  for (const c of customers) {
    const p = normalizePhone(c.phone);
    if (p) {
      const arr = byPhone.get(p) ?? [];
      arr.push(c);
      byPhone.set(p, arr);
    }
    const e = normalizeEmail(c.email);
    if (e) {
      const arr = byEmail.get(e) ?? [];
      arr.push(c);
      byEmail.set(e, arr);
    }
  }
  return { byPhone, byEmail };
}
