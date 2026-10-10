export interface MergeContext {
  first_name?: string;
  last_name?: string;
  last_order_date?: string;
  zone?: string;
  offer_code?: string;
  promo_code?: string;
  business_name?: string;
  location_name?: string;
}

const FIELD_RE = /\{\{\s*([a-z_]+)\s*\}\}/g;

export function renderTemplate(body: string, ctx: MergeContext): string {
  return body.replace(FIELD_RE, (_m, key: string) => {
    const v = (ctx as Record<string, unknown>)[key];
    return v == null ? '' : String(v);
  });
}

export function extractFields(body: string): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = FIELD_RE.exec(body))) found.add(m[1]);
  return [...found];
}

export const ALLOWED_FIELDS = new Set([
  'first_name',
  'last_name',
  'last_order_date',
  'zone',
  'offer_code',
  'promo_code',
  'business_name',
  'location_name',
]);
