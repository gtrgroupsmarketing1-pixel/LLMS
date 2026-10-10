import crypto from 'node:crypto';

export function generatePromoCode(tenantSlug: string, campaignName: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${tenantSlug}:${campaignName}:${Date.now()}`)
    .digest('hex')
    .slice(0, 6)
    .toUpperCase();
  return `${tenantSlug.slice(0, 4).toUpperCase()}${hash}`;
}

export interface UtmInput {
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
}

export function buildUtmUrl(input: UtmInput): string {
  const url = new URL(input.baseUrl);
  url.searchParams.set('utm_source', input.source);
  url.searchParams.set('utm_medium', input.medium);
  url.searchParams.set('utm_campaign', input.campaign);
  if (input.content) url.searchParams.set('utm_content', input.content);
  return url.toString();
}
