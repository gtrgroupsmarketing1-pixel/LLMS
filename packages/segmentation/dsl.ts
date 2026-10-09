import { z } from 'zod';

const OperatorEnum = z.enum([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'not_in',
  'between',
  'contains',
  'starts_with',
  'exists',
  'not_exists',
]);

const FieldEnum = z.enum([
  'language',
  'zone',
  'source',
  'createdAt',
  'orderCount',
  'lastOrderAt',
  'totalSpend',
  'avgOrderValue',
  'daysSinceLastOrder',
  'isVip',
  'isSubscription',
  'isCommercial',
  'engagementScore',
  'promoRedeemed',
  'whatsappOptIn',
  'websiteLead',
]);

const RuleSchema = z.object({
  field: FieldEnum,
  operator: OperatorEnum,
  value: z
    .union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.union([z.string(), z.number()])),
    ])
    .optional(),
});

export type Rule = z.infer<typeof RuleSchema>;

export interface Group {
  logic: 'AND' | 'OR';
  rules: Array<Rule | Group>;
}

const GroupSchema: z.ZodType<Group> = z.lazy(() =>
  z.object({
    logic: z.enum(['AND', 'OR']),
    rules: z.array(z.union([RuleSchema, GroupSchema])),
  }),
);

export const SegmentDefinitionSchema = z.object({
  logic: z.enum(['AND', 'OR']),
  rules: z.array(z.union([RuleSchema, GroupSchema])),
});

export type SegmentDefinition = z.infer<typeof SegmentDefinitionSchema>;

export interface NormalizedCustomer {
  id: string;
  tenantId: string;
  language: string;
  zone: string | null;
  source: string;
  createdAt: Date;
  orderCount: number;
  lastOrderAt: Date | null;
  totalSpend: number;
  avgOrderValue: number;
  daysSinceLastOrder: number | null;
  isVip: boolean;
  isSubscription: boolean;
  isCommercial: boolean;
  engagementScore: number;
  promoRedeemed: boolean;
  whatsappOptIn: boolean;
  websiteLead: boolean;
}

export function evaluateRule(rule: Rule, c: NormalizedCustomer): boolean {
  const v = (c as unknown as Record<string, unknown>)[rule.field];
  const { operator, value } = rule;

  switch (operator) {
    case 'eq':
      return v === value;
    case 'neq':
      return v !== value;
    case 'gt':
      return typeof v === 'number' && typeof value === 'number' && v > value;
    case 'gte':
      return typeof v === 'number' && typeof value === 'number' && v >= value;
    case 'lt':
      return typeof v === 'number' && typeof value === 'number' && v < value;
    case 'lte':
      return typeof v === 'number' && typeof value === 'number' && v <= value;
    case 'in':
      return Array.isArray(value) && (value as unknown[]).includes(v as never);
    case 'not_in':
      return Array.isArray(value) && !(value as unknown[]).includes(v as never);
    case 'between':
      return (
        Array.isArray(value) &&
        value.length === 2 &&
        typeof v === 'number' &&
        v >= Number(value[0]) &&
        v <= Number(value[1])
      );
    case 'contains':
      return typeof v === 'string' && typeof value === 'string' && v.includes(value);
    case 'starts_with':
      return typeof v === 'string' && typeof value === 'string' && v.startsWith(value);
    case 'exists':
      return v !== null && v !== undefined;
    case 'not_exists':
      return v === null || v === undefined;
    default:
      return false;
  }
}

export function evaluateGroup(group: Group, c: NormalizedCustomer): boolean {
  if (group.logic === 'AND') {
    return group.rules.every((r) =>
      'logic' in r ? evaluateGroup(r, c) : evaluateRule(r, c),
    );
  }
  return group.rules.some((r) =>
    'logic' in r ? evaluateGroup(r, c) : evaluateRule(r, c),
  );
}

export function evaluateDefinition(
  def: SegmentDefinition,
  c: NormalizedCustomer,
): boolean {
  return evaluateGroup(def, c);
}
