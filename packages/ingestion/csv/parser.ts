import { parse } from 'csv-parse';
import { Readable } from 'node:stream';

export interface RawCustomerRow {
  phone: string;
  email?: string;
  name?: string;
  language?: string;
  zone?: string;
  consentStatus?: string;
  consentSource?: string;
  [key: string]: unknown;
}

export interface ParsedRow {
  rowNumber: number;
  raw: RawCustomerRow;
  errors: string[];
}

export interface ParseResult {
  rows: ParsedRow[];
  total: number;
  valid: number;
  invalid: number;
}

const REQUIRED_HEADERS = ['phone'];

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+')) return '+' + digits.slice(1).replace(/\D/g, '');
  if (digits.startsWith('00')) return '+' + digits.slice(2);
  return '+' + digits;
}

export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function parseCustomerCsv(
  input: Buffer | Readable | string,
): Promise<ParseResult> {
  const stream =
    typeof input === 'string'
      ? Readable.from([input])
      : Buffer.isBuffer(input)
        ? Readable.from(input)
        : input;

  const parser = stream.pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }),
  );

  const rows: ParsedRow[] = [];
  let total = 0;
  let valid = 0;
  let invalid = 0;
  let headerChecked = false;

  for await (const record of parser as AsyncIterable<Record<string, string>>) {
    if (!headerChecked) {
      for (const h of REQUIRED_HEADERS) {
        if (!(h in record)) {
          throw new Error(`Missing required column: ${h}`);
        }
      }
      headerChecked = true;
    }
    total += 1;
    const errors: string[] = [];
    const phone = normalizePhone(record.phone ?? '');
    if (!phone) errors.push('invalid_phone');
    const email = record.email?.trim().toLowerCase();
    if (email && !isEmail(email)) errors.push('invalid_email');
    const consentStatus = (
      record.consent_status ??
      record.consentStatus ??
      ''
    ).toLowerCase();
    const consentSource = record.consent_source ?? record.consentSource ?? '';
    const name = record.name?.trim();
    const zone = record.zone?.trim();
    const language = record.language?.trim() || 'ar';

    const row: ParsedRow = {
      rowNumber: total,
      raw: { phone, email, name, language, zone, consentStatus, consentSource },
      errors,
    };
    if (errors.length) invalid += 1;
    else valid += 1;
    rows.push(row);
  }

  return { rows, total, valid, invalid };
}
