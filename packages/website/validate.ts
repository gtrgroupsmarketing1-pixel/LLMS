import { BlockSchema, type Block } from './blocks';
import { z } from 'zod';

export interface ValidateBlocksResult {
  valid: boolean;
  blocks: Block[];
  errors: string[];
}

export function validateBlocks(raw: unknown): ValidateBlocksResult {
  if (!Array.isArray(raw)) {
    return { valid: false, blocks: [], errors: ['blocks must be an array'] };
  }

  const blocks: Block[] = [];
  const errors: string[] = [];

  raw.forEach((item, i) => {
    const parsed = BlockSchema.safeParse(item);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`blocks[${i}].${issue.path.join('.')}: ${issue.message}`);
      }
      return;
    }
    blocks.push(parsed.data);
  });

  // At most one hero block per page
  if (blocks.filter((b) => b.type === 'hero').length > 1) {
    errors.push('Only one hero block per page is allowed');
  }

  // At most one footer block per page
  if (blocks.filter((b) => b.type === 'footer').length > 1) {
    errors.push('Only one footer block per page is allowed');
  }

  return {
    valid: errors.length === 0,
    blocks,
    errors,
  };
}

export function assertValidBlocks(raw: unknown): Block[] {
  const r = validateBlocks(raw);
  if (!r.valid) {
    throw new Error(`invalid_blocks:\n${r.errors.join('\n')}`);
  }
  return r.blocks;
}

export function pageSchema() {
  return z.object({
    slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
    titleEn: z.string().min(1).max(120),
    titleAr: z.string().max(120).optional(),
    blocks: z.array(BlockSchema).min(1).max(20),
    seo: z
      .object({
        titleEn: z.string().max(120).optional(),
        titleAr: z.string().max(120).optional(),
        descriptionEn: z.string().max(280).optional(),
        descriptionAr: z.string().max(280).optional(),
        ogImageUrl: z.string().url().optional(),
      })
      .optional(),
  });
}

export type PageInput = z.infer<ReturnType<typeof pageSchema>>;
