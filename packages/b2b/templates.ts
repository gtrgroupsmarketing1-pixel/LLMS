export interface OutreachTemplate {
  key: string;
  category: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'CALL' | 'LINKEDIN' | 'IN_PERSON';
  language: 'ar' | 'en';
  subject?: string;
  body: string;
}

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    key: 'hotel_intro_en',
    category: 'HOTEL',
    channel: 'EMAIL',
    language: 'en',
    subject: 'Laundry partnership for {{business_name}}',
    body:
      'Hi {{contact_name}},\n\nWe work with hotels across {{country}} to handle high-volume laundry with same-day turnaround and reliable pickup. Would you have 15 minutes this week to discuss a partnership?\n\nBest,\n{{sender_name}}',
  },
  {
    key: 'hotel_intro_ar',
    category: 'HOTEL',
    channel: 'EMAIL',
    language: 'ar',
    subject: 'شراكة خدمات الغسيل لـ {{business_name}}',
    body:
      'مرحباً {{contact_name}}،\n\nنعمل مع الفنادق في {{country}} لتقديم خدمات غسيل بكميات كبيرة مع تسليم في نفس اليوم واستلام موثوق. هل يمكننا مناقشة شراكة محتملة هذا الأسبوع؟\n\nمع التحية،\n{{sender_name}}',
  },
  {
    key: 'gym_intro_en',
    category: 'GYM',
    channel: 'WHATSAPP',
    language: 'en',
    body:
      'Hi {{contact_name}}, we provide towel and uniform laundry for gyms across {{country}}. Interested in a quick quote?',
  },
  {
    key: 'gym_intro_ar',
    category: 'GYM',
    channel: 'WHATSAPP',
    language: 'ar',
    body:
      'مرحباً {{contact_name}}، نقدم خدمة غسيل المناشف والزي الرياضي للصالات الرياضية في {{country}}. هل ترغب بعرض سعر سريع؟',
  },
  {
    key: 'airbnb_intro_en',
    category: 'AIRBNB',
    channel: 'EMAIL',
    language: 'en',
    subject: 'Turnover laundry for {{business_name}}',
    body:
      'Hi {{contact_name}},\n\nWe help short-term rental hosts in {{country}} with fast turnover laundry between guests. Same-day pickup and drop-off included.\n\nWant a pricing sheet?\n\n{{sender_name}}',
  },
  {
    key: 'restaurant_intro_en',
    category: 'RESTAURANT',
    channel: 'WHATSAPP',
    language: 'en',
    body:
      'Hi {{contact_name}}, we handle linens, uniforms, and aprons for restaurants in {{country}}. Do you want to compare pricing?',
  },
  {
    key: 'office_intro_en',
    category: 'OFFICE',
    channel: 'EMAIL',
    language: 'en',
    subject: 'Corporate laundry for {{business_name}}',
    body:
      'Hi {{contact_name}},\n\nWe support offices in {{country}} with weekly laundry for staff uniforms and event linens. Happy to send a proposal.\n\n{{sender_name}}',
  },
];

export function templatesForCategory(category: string): OutreachTemplate[] {
  return OUTREACH_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplate(key: string): OutreachTemplate | undefined {
  return OUTREACH_TEMPLATES.find((t) => t.key === key);
}

export function renderTemplate(
  body: string,
  ctx: Record<string, string | undefined>,
): string {
  return body.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_m, k: string) =>
    String(ctx[k] ?? ''),
  );
}

export const ALLOWED_MERGE_FIELDS = new Set([
  'business_name',
  'contact_name',
  'country',
  'zone',
  'sender_name',
  'offer_code',
]);
