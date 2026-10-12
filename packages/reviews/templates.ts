export interface ResponseTemplate {
  topic: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  language: 'ar' | 'en';
  body: string;
}

export const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  {
    topic: 'SERVICE_QUALITY',
    sentiment: 'POSITIVE',
    language: 'en',
    body: 'Thank you for the kind words! We take pride in our quality and look forward to serving you again.',
  },
  {
    topic: 'SERVICE_QUALITY',
    sentiment: 'POSITIVE',
    language: 'ar',
    body: 'شكراً لكلماتك الطيبة! نفتخر بجودة خدماتنا ونتطلع لخدمتك مرة أخرى.',
  },
  {
    topic: 'SERVICE_QUALITY',
    sentiment: 'NEGATIVE',
    language: 'en',
    body: 'We are sorry to hear about your experience. Please contact us directly so we can make it right.',
  },
  {
    topic: 'SERVICE_QUALITY',
    sentiment: 'NEGATIVE',
    language: 'ar',
    body: 'نأسف لتجربتك. يرجى التواصل معنا مباشرة حتى نتمكن من تصحيح الأمر.',
  },
  {
    topic: 'TIMELINESS',
    sentiment: 'NEGATIVE',
    language: 'en',
    body: 'We apologize for the delay. We are reviewing our pickup and delivery windows to prevent this.',
  },
  {
    topic: 'TIMELINESS',
    sentiment: 'NEGATIVE',
    language: 'ar',
    body: 'نعتذر عن التأخير. نراجع مواعيد الاستلام والتسليم لمنع تكرار ذلك.',
  },
  {
    topic: 'PRICE',
    sentiment: 'NEGATIVE',
    language: 'en',
    body: 'Thank you for the feedback on pricing. We would love to show you our subscription options for better value.',
  },
  {
    topic: 'PRICE',
    sentiment: 'NEGATIVE',
    language: 'ar',
    body: 'شكراً لملاحظتك حول السعر. يسعدنا أن نعرض عليك باقات الاشتراك للحصول على قيمة أفضل.',
  },
  {
    topic: 'STAFF',
    sentiment: 'NEGATIVE',
    language: 'en',
    body: 'We apologize for how you were treated. This is not our standard. Please reach out so we can address it.',
  },
  {
    topic: 'STAFF',
    sentiment: 'NEGATIVE',
    language: 'ar',
    body: 'نعتذر عن طريقة التعامل. هذا ليس أسلوبنا المعتاد. يرجى التواصل معنا لمعالجة الأمر.',
  },
  {
    topic: 'OTHER',
    sentiment: 'POSITIVE',
    language: 'en',
    body: 'Thank you for taking the time to review us! We appreciate your business.',
  },
  {
    topic: 'OTHER',
    sentiment: 'POSITIVE',
    language: 'ar',
    body: 'شكراً لتقييمك! نقدّر ثقتك بنا.',
  },
  {
    topic: 'OTHER',
    sentiment: 'NEUTRAL',
    language: 'en',
    body: 'Thank you for your feedback. If there is anything we can improve, please let us know.',
  },
  {
    topic: 'OTHER',
    sentiment: 'NEUTRAL',
    language: 'ar',
    body: 'شكراً لملاحظاتك. إذا كان هناك أي شيء يمكننا تحسينه، يرجى إخبارنا.',
  },
];

export function pickTemplate(
  topics: string[],
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE',
  language: 'ar' | 'en',
): string {
  const firstTopic = topics[0] ?? 'OTHER';
  const byTopic = RESPONSE_TEMPLATES.find(
    (t) => t.topic === firstTopic && t.sentiment === sentiment && t.language === language,
  );
  if (byTopic) return byTopic.body;

  const fallback = RESPONSE_TEMPLATES.find(
    (t) => t.topic === 'OTHER' && t.sentiment === sentiment && t.language === language,
  );
  if (fallback) return fallback.body;

  return RESPONSE_TEMPLATES.find(
    (t) => t.topic === 'OTHER' && t.sentiment === 'NEUTRAL' && t.language === language,
  )!.body;
}
