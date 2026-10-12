import { z } from 'zod';

export const NodeTypeEnum = z.enum([
  'TRIGGER',
  'WAIT',
  'CONDITION',
  'SEND',
  'SPLIT',
  'END',
]);
export type NodeType = z.infer<typeof NodeTypeEnum>;

export const TriggerTypeEnum = z.enum([
  'ORDER_DELIVERED',
  'NEW_CUSTOMER',
  'REVIEW_POSTED',
  'PROMO_SENT_NOT_REDEEMED',
  'AD_SPEND_THRESHOLD',
  'TEMPLATE_REJECTED',
  'ERP_SYNC_FAILED',
  'CSV_IMPORT_COMPLETED',
  'DAYS_SINCE_LAST_ORDER',
  'DAYS_SINCE_LAST_ENGAGEMENT',
  'BIRTHDAY',
  'SUBSCRIPTION_RENEWAL_SOON',
  'ANNIVERSARY',
]);
export type TriggerType = z.infer<typeof TriggerTypeEnum>;

export const WaitUnitEnum = z.enum(['MINUTES', 'HOURS', 'DAYS']);
export type WaitUnit = z.infer<typeof WaitUnitEnum>;

const TriggerConfigSchema = z.object({
  type: TriggerTypeEnum,
  value: z.number().int().min(1).max(365).optional(),
  mode: z.enum(['EVENT', 'TIME']).default('EVENT'),
});

const WaitConfigSchema = z.object({
  amount: z.number().int().min(5).max(365 * 24 * 60).default(1),
  unit: WaitUnitEnum.default('DAYS'),
});

const ConditionConfigSchema = z.object({
  logic: z.enum(['AND', 'OR']),
  rules: z.array(z.unknown()).min(1),
});

const SendConfigSchema = z.object({
  templateGroupId: z.string().min(1),
  channel: z.enum(['WHATSAPP', 'SMS', 'EMAIL']).default('WHATSAPP'),
});

const SplitConfigSchema = z.object({
  aWeight: z.number().int().min(0).max(100),
  bWeight: z.number().int().min(0).max(100),
});

export const NodeSchema = z
  .object({
    id: z.string().min(1),
    type: NodeTypeEnum,
    label: z.string().optional(),
    x: z.number(),
    y: z.number(),
    trigger: TriggerConfigSchema.optional(),
    wait: WaitConfigSchema.optional(),
    condition: ConditionConfigSchema.optional(),
    send: SendConfigSchema.optional(),
    split: SplitConfigSchema.optional(),
  })
  .superRefine((node, ctx) => {
    if (node.type === 'TRIGGER' && !node.trigger) {
      ctx.addIssue({ code: 'custom', message: 'TRIGGER node missing trigger config' });
    }
    if (node.type === 'WAIT' && !node.wait) {
      ctx.addIssue({ code: 'custom', message: 'WAIT node missing wait config' });
    }
    if (node.type === 'CONDITION' && !node.condition) {
      ctx.addIssue({ code: 'custom', message: 'CONDITION node missing condition config' });
    }
    if (node.type === 'SEND' && !node.send) {
      ctx.addIssue({ code: 'custom', message: 'SEND node missing send config' });
    }
    if (node.type === 'SPLIT' && !node.split) {
      ctx.addIssue({ code: 'custom', message: 'SPLIT node missing split config' });
    }
    if (node.type === 'SPLIT' && node.split) {
      if (node.split.aWeight + node.split.bWeight !== 100) {
        ctx.addIssue({
          code: 'custom',
          message: 'SPLIT weights must sum to 100',
        });
      }
    }
  });
export type JourneyNode = z.infer<typeof NodeSchema>;

export const EdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  branch: z.enum(['a', 'b', 'yes', 'no', 'default']).optional(),
});
export type JourneyEdge = z.infer<typeof EdgeSchema>;

export const ExitRuleSchema = z.object({
  type: z.enum([
    'CUSTOMER_REPLIED',
    'CUSTOMER_OPTED_OUT',
    'CUSTOMER_ON_DNC',
    'ERP_DATA_STALE',
    'FREQUENCY_CAP',
  ]),
});
export type ExitRule = z.infer<typeof ExitRuleSchema>;

export const JourneyDefinitionSchema = z.object({
  nodes: z.array(NodeSchema).min(2),
  edges: z.array(EdgeSchema).min(1),
  exitRules: z.array(ExitRuleSchema).default([
    { type: 'CUSTOMER_REPLIED' },
    { type: 'CUSTOMER_OPTED_OUT' },
    { type: 'CUSTOMER_ON_DNC' },
    { type: 'ERP_DATA_STALE' },
  ]),
});
export type JourneyDefinition = z.infer<typeof JourneyDefinitionSchema>;
