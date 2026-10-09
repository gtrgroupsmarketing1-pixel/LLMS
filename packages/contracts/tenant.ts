import { z } from 'zod';
import { OPERATING_MODES, GCC_COUNTRIES, PACKAGES } from '@lmms/config';

const countryCodes = GCC_COUNTRIES.map((c) => c.code) as [string, ...string[]];

export const TenantCreateSchema = z.object({
  nameAr: z.string().min(1).max(120),
  nameEn: z.string().min(1).max(120),
  mode: z.enum(OPERATING_MODES),
  country: z.enum(countryCodes),
  currency: z.string().length(3),
  timezone: z.string().min(1),
  package: z.enum(PACKAGES),
});
export type TenantCreateInput = z.infer<typeof TenantCreateSchema>;

export const TenantListQuerySchema = z.object({
  mode: z.enum(OPERATING_MODES).optional(),
  country: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});
export type TenantListQuery = z.infer<typeof TenantListQuerySchema>;
