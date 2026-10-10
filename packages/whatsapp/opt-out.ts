const OPT_OUT_KEYWORDS = new Set([
  'stop',
  'unsubscribe',
  'cancel',
  'إلغاء',
  'ايقاف',
  'إيقاف',
  'الغاء',
]);

export function isOptOutKeyword(text: string): boolean {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  return OPT_OUT_KEYWORDS.has(normalized);
}
