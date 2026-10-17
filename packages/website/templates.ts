import type { Block } from './blocks';

export interface PageTemplate {
  key: string;
  title: string;
  titleAr: string;
  description: string;
  blocks: Block[];
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    key: 'laundry_home',
    title: 'Laundry home',
    titleAr: 'الصفحة الرئيسية',
    description: 'Hero + features + pricing + CTA + form + footer',
    blocks: [
      {
        type: 'hero',
        headline: 'Fresh laundry, delivered to your door',
        subheadline: 'Same-day pickup and delivery across the city.',
        ctaLabel: 'Book now',
        ctaHref: '#book',
        variant: 'centered',
      },
      {
        type: 'features',
        title: 'Why choose us',
        items: [
          { title: 'Same-day pickup', description: 'Book before 10 AM, delivered by evening.' },
          { title: 'Eco detergents', description: 'Safe for delicate fabrics and kids.' },
          { title: 'Trusted by families', description: 'Thousands of happy customers.' },
        ],
      },
      {
        type: 'pricing',
        title: 'Simple pricing',
        items: [
          { name: 'Wash & Fold', price: '25', unit: 'AED / kg', features: ['Wash', 'Dry', 'Fold'], featured: true },
          { name: 'Dry Cleaning', price: '15', unit: 'AED / item', features: ['Gentle clean'], featured: false },
        ],
      },
      {
        type: 'form',
        title: 'Book a pickup',
        description: 'We will call you within 5 minutes.',
        fields: ['name', 'phone', 'zone', 'message'],
        submitLabel: 'Book pickup',
        successMessage: 'Thank you! We will call you shortly.',
      },
      {
        type: 'footer',
        copyright: '© LMMS Laundry',
        socials: [{ network: 'whatsapp', href: 'https://wa.me/971500000000' }],
      },
    ],
  },
  {
    key: 'laundry_services',
    title: 'Services page',
    titleAr: 'صفحة الخدمات',
    description: 'Text + features + faq + cta + footer',
    blocks: [
      { type: 'hero', headline: 'Our services', variant: 'centered' },
      {
        type: 'features',
        title: 'What we do',
        items: [
          { title: 'Wash & Fold', description: 'Everyday laundry, done right.' },
          { title: 'Dry Cleaning', description: 'Delicates handled with care.' },
          { title: 'Bulk Laundry', description: 'For hotels, gyms, and offices.' },
        ],
      },
      {
        type: 'faq',
        title: 'Common questions',
        items: [
          { question: 'How long does delivery take?', answer: 'Same day for orders before 10 AM.' },
          { question: 'Do you use eco detergents?', answer: 'Yes — safe for the whole family.' },
        ],
      },
      {
        type: 'cta',
        headline: 'Ready to try us?',
        buttonLabel: 'Book now',
        buttonHref: '#book',
        variant: 'banner',
      },
      { type: 'footer', copyright: '© LMMS Laundry' },
    ],
  },
  {
    key: 'laundry_b2b',
    title: 'B2B page',
    titleAr: 'صفحة B2B',
    description: 'Hero + text + features + form + footer for hotels/gyms',
    blocks: [
      {
        type: 'hero',
        headline: 'Laundry for hotels, gyms, and offices',
        subheadline: 'Reliable pickup, invoicing, and quality you can trust.',
        ctaLabel: 'Request pricing',
        ctaHref: '#contact',
        variant: 'split',
      },
      {
        type: 'text',
        content:
          'We support hospitality and fitness businesses across the GCC with high-volume laundry, uniform cleaning, and monthly invoicing.',
        align: 'start',
      },
      {
        type: 'features',
        title: 'Built for B2B',
        items: [
          { title: 'Volume discounts', description: 'Predictable pricing as you scale.' },
          { title: 'Scheduled pickups', description: 'Daily or weekly routes.' },
          { title: 'Invoices & receipts', description: 'Consolidated monthly billing.' },
        ],
      },
      {
        type: 'form',
        title: 'Request pricing',
        fields: ['name', 'phone', 'email', 'message'],
        submitLabel: 'Request pricing',
        successMessage: 'Thank you — our team will reach out within 24 hours.',
      },
      { type: 'footer', copyright: '© LMMS Laundry' },
    ],
  },
];

export function getTemplate(key: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find((t) => t.key === key);
}
