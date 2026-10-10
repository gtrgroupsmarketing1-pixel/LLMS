export interface AutomationDef {
  slug: string;
  name: string;
  nameAr: string;
  mode: 'ERP_ONLY' | 'STANDALONE_ONLY' | 'BOTH';
  priority: number;
  trigger:
    | { type: 'ORDER_DELIVERED' }
    | { type: 'DAYS_SINCE_LAST_ORDER'; value: number }
    | { type: 'DAYS_SINCE_LAST_ENGAGEMENT'; value: number }
    | { type: 'NEW_CUSTOMER' }
    | { type: 'PROMO_NOT_REDEEMED' };
  frequencyCapHours: number;
}

export const ERP_AUTOMATIONS: AutomationDef[] = [
  {
    slug: 'erp_review_request',
    name: 'Review Request',
    nameAr: 'طلب التقييم',
    mode: 'ERP_ONLY',
    priority: 10,
    trigger: { type: 'ORDER_DELIVERED' },
    frequencyCapHours: 24,
  },
  {
    slug: 'erp_winback_60',
    name: 'Win-back 60',
    nameAr: 'استعادة ٦٠ يوم',
    mode: 'ERP_ONLY',
    priority: 50,
    trigger: { type: 'DAYS_SINCE_LAST_ORDER', value: 60 },
    frequencyCapHours: 24,
  },
  {
    slug: 'erp_winback_90',
    name: 'Win-back 90',
    nameAr: 'استعادة ٩٠ يوم',
    mode: 'ERP_ONLY',
    priority: 50,
    trigger: { type: 'DAYS_SINCE_LAST_ORDER', value: 90 },
    frequencyCapHours: 24,
  },
  {
    slug: 'erp_dormant_120',
    name: 'Dormant Reactivation 120',
    nameAr: 'تنشيط الخاملين ١٢٠',
    mode: 'ERP_ONLY',
    priority: 60,
    trigger: { type: 'DAYS_SINCE_LAST_ORDER', value: 120 },
    frequencyCapHours: 24,
  },
  {
    slug: 'erp_post_first_order',
    name: 'Post-First-Order Follow-up',
    nameAr: 'متابعة الطلب الأول',
    mode: 'ERP_ONLY',
    priority: 20,
    trigger: { type: 'ORDER_DELIVERED' },
    frequencyCapHours: 24,
  },
];

export const STANDALONE_AUTOMATIONS: AutomationDef[] = [
  {
    slug: 'sa_welcome',
    name: 'Welcome',
    nameAr: 'ترحيب',
    mode: 'STANDALONE_ONLY',
    priority: 5,
    trigger: { type: 'NEW_CUSTOMER' },
    frequencyCapHours: 24,
  },
  {
    slug: 'sa_engagement_winback_60',
    name: 'Engagement Win-back 60',
    nameAr: 'استعادة التفاعل ٦٠',
    mode: 'STANDALONE_ONLY',
    priority: 50,
    trigger: { type: 'DAYS_SINCE_LAST_ENGAGEMENT', value: 60 },
    frequencyCapHours: 24,
  },
  {
    slug: 'sa_engagement_winback_90',
    name: 'Engagement Win-back 90',
    nameAr: 'استعادة التفاعل ٩٠',
    mode: 'STANDALONE_ONLY',
    priority: 50,
    trigger: { type: 'DAYS_SINCE_LAST_ENGAGEMENT', value: 90 },
    frequencyCapHours: 24,
  },
  {
    slug: 'sa_promo_non_redeemer',
    name: 'Promo Non-Redeemer Reminder',
    nameAr: 'تذكير غير مستخدمي العرض',
    mode: 'STANDALONE_ONLY',
    priority: 40,
    trigger: { type: 'PROMO_NOT_REDEEMED' },
    frequencyCapHours: 24,
  },
];

export const ALL_AUTOMATIONS: AutomationDef[] = [
  ...ERP_AUTOMATIONS,
  ...STANDALONE_AUTOMATIONS,
];

export function isAutomationAvailable(
  automationMode: AutomationDef['mode'],
  tenantMode: 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING',
): { available: boolean; reason?: string } {
  if (automationMode === 'BOTH') return { available: true };
  if (automationMode === 'ERP_ONLY') {
    if (tenantMode === 'ERP_CONNECTED' || tenantMode === 'UPGRADING') {
      return { available: true };
    }
    return { available: false, reason: 'Requires ERP connection' };
  }
  if (automationMode === 'STANDALONE_ONLY') {
    if (tenantMode === 'STANDALONE' || tenantMode === 'UPGRADING') {
      return { available: true };
    }
    return { available: false, reason: 'Available in Standalone mode' };
  }
  return { available: true };
}
