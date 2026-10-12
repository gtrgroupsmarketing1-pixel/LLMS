type ReviewSentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'UNKNOWN';
type ReviewTopic =
  | 'SERVICE_QUALITY'
  | 'TIMELINESS'
  | 'PRICE'
  | 'STAFF'
  | 'CLEANLINESS'
  | 'LOCATION'
  | 'PACKAGING'
  | 'OTHER';

const POSITIVE = [
  'excellent', 'great', 'amazing', 'perfect', 'fast', 'clean', 'friendly',
  'recommend', 'best', 'love', 'awesome', 'professional', 'helpful',
  'ممتاز', 'رائع', 'سريع', 'نظيف', 'ودود', 'أنصح', 'أفضل', 'محترف',
];

const NEGATIVE = [
  'terrible', 'awful', 'late', 'dirty', 'rude', 'slow', 'damaged',
  'lost', 'expensive', 'worst', 'never again', 'disappointed', 'broken',
  'سيء', 'تأخير', 'متأخر', 'قذر', 'وقح', 'بطيء', 'تالف', 'مفقود',
  'غالي', 'أسوأ', 'مخيب',
];

const TOPIC_KEYWORDS: Record<string, string[]> = {
  SERVICE_QUALITY: ['quality', 'clean', 'stain', 'spot', 'damage', 'جودة', 'بقع', 'تلف'],
  TIMELINESS: ['late', 'slow', 'fast', 'quick', 'delay', 'متأخر', 'بطيء', 'سريع', 'تأخير'],
  PRICE: ['price', 'cost', 'expensive', 'cheap', 'value', 'سعر', 'غالي', 'رخيص'],
  STAFF: ['staff', 'employee', 'manager', 'rude', 'polite', 'موظف', 'مدير', 'وقح', 'مهذب'],
  CLEANLINESS: ['dirty', 'smell', 'stain', 'قذر', 'رائحة', 'بقع'],
  LOCATION: ['location', 'parking', 'far', 'near', 'موقع', 'موقف', 'بعيد', 'قريب'],
  PACKAGING: ['packaging', 'bag', 'wrap', 'تغليف', 'كيس', 'لف'],
};

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) count += 1;
  }
  return count;
}

export function tagSentiment(text: string | null, rating: number): ReviewSentiment {
  if (!text) {
    if (rating >= 4) return 'POSITIVE';
    if (rating <= 2) return 'NEGATIVE';
    return 'NEUTRAL';
  }
  const pos = countMatches(text, POSITIVE);
  const neg = countMatches(text, NEGATIVE);
  if (pos > neg) return 'POSITIVE';
  if (neg > pos) return 'NEGATIVE';
  if (rating >= 4) return 'POSITIVE';
  if (rating <= 2) return 'NEGATIVE';
  return 'NEUTRAL';
}

export function tagTopics(text: string | null): ReviewTopic[] {
  if (!text) return [];
  const found: ReviewTopic[] = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (countMatches(text, keywords) > 0) {
      found.push(topic as ReviewTopic);
    }
  }
  return found;
}
