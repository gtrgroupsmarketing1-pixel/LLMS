import { z } from 'zod';

/**
 * Whitelisted block schema. The renderer (in `apps/web`) knows how to
 * render each block type. Tenants cannot inject arbitrary HTML or JS.
 */

export const HeroBlock = z.object({
  type: z.literal('hero'),
  headline: z.string().min(1).max(140),
  subheadline: z.string().max(280).optional(),
  ctaLabel: z.string().max(40).optional(),
  ctaHref: z.string().max(200).optional(),
  imageUrl: z.string().url().optional(),
  variant: z.enum(['centered', 'split', 'overlay']).default('centered'),
});

export const FeaturesBlock = z.object({
  type: z.literal('features'),
  title: z.string().max(120).optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(80),
        description: z.string().max(240).optional(),
        icon: z.string().max(40).optional(),
      }),
    )
    .min(1)
    .max(8),
});

export const TextBlock = z.object({
  type: z.literal('text'),
  content: z.string().min(1).max(4000),
  align: z.enum(['start', 'center', 'end']).default('start'),
});

export const ImageBlock = z.object({
  type: z.literal('image'),
  url: z.string().url(),
  alt: z.string().max(120),
  caption: z.string().max(200).optional(),
  layout: z.enum(['full', 'half', 'contained']).default('contained'),
});

export const CtaBlock = z.object({
  type: z.literal('cta'),
  headline: z.string().min(1).max(120),
  subheadline: z.string().max(240).optional(),
  buttonLabel: z.string().min(1).max(40),
  buttonHref: z.string().max(200),
  variant: z.enum(['primary', 'secondary', 'banner']).default('primary'),
});

export const FormBlock = z.object({
  type: z.literal('form'),
  title: z.string().max(120).optional(),
  description: z.string().max(400).optional(),
  fields: z
    .array(z.enum(['name', 'phone', 'email', 'zone', 'message']))
    .min(1)
    .max(5)
    .refine((fields) => fields.includes('phone') || fields.includes('email'), {
      message: 'Form must include phone or email',
    }),
  submitLabel: z.string().max(40).default('Book now'),
  successMessage: z.string().max(280).default('Thank you — we will contact you shortly.'),
});

export const TestimonialsBlock = z.object({
  type: z.literal('testimonials'),
  title: z.string().max(120).optional(),
  items: z
    .array(
      z.object({
        quote: z.string().min(1).max(400),
        author: z.string().min(1).max(80),
        rating: z.number().int().min(1).max(5).optional(),
      }),
    )
    .min(1)
    .max(6),
});

export const PricingBlock = z.object({
  type: z.literal('pricing'),
  title: z.string().max(120).optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        price: z.string().min(1).max(40),
        unit: z.string().max(40).optional(),
        features: z.array(z.string().max(80)).max(10).optional(),
        featured: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(4),
});

export const FaqBlock = z.object({
  type: z.literal('faq'),
  title: z.string().max(120).optional(),
  items: z
    .array(
      z.object({
        question: z.string().min(1).max(200),
        answer: z.string().min(1).max(1000),
      }),
    )
    .min(1)
    .max(20),
});

export const GalleryBlock = z.object({
  type: z.literal('gallery'),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().max(120),
      }),
    )
    .min(1)
    .max(12),
  layout: z.enum(['grid', 'carousel']).default('grid'),
});

export const ContactBlock = z.object({
  type: z.literal('contact'),
  title: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional(),
  address: z.string().max(280).optional(),
  mapEmbedUrl: z.string().url().optional(),
});

export const FooterBlock = z.object({
  type: z.literal('footer'),
  copyright: z.string().max(200).optional(),
  links: z
    .array(
      z.object({
        label: z.string().min(1).max(60),
        href: z.string().max(200),
      }),
    )
    .max(6)
    .optional(),
  socials: z
    .array(
      z.object({
        network: z.enum(['whatsapp', 'instagram', 'facebook', 'x', 'linkedin']),
        href: z.string().max(200),
      }),
    )
    .max(5)
    .optional(),
});

export const BlockSchema = z.discriminatedUnion('type', [
  HeroBlock,
  FeaturesBlock,
  TextBlock,
  ImageBlock,
  CtaBlock,
  FormBlock,
  TestimonialsBlock,
  PricingBlock,
  FaqBlock,
  GalleryBlock,
  ContactBlock,
  FooterBlock,
]);

export type Block = z.infer<typeof BlockSchema>;
export type BlockType = Block['type'];

export const ALLOWED_BLOCK_TYPES: BlockType[] = [
  'hero',
  'features',
  'text',
  'image',
  'cta',
  'form',
  'testimonials',
  'pricing',
  'faq',
  'gallery',
  'contact',
  'footer',
];
