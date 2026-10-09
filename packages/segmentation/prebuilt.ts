import type { SegmentDefinition } from './dsl';

export interface PrebuiltSegment {
  name: string;
  nameAr: string;
  mode: 'BOTH' | 'ERP_ONLY' | 'STANDALONE_ONLY';
  definition: SegmentDefinition;
}

export const PREBUILT_ERP: PrebuiltSegment[] = [
  {
    name: 'New',
    nameAr: 'جديد',
    mode: 'ERP_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'orderCount', operator: 'lte', value: 1 }],
    },
  },
  {
    name: 'Active',
    nameAr: 'نشط',
    mode: 'ERP_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'daysSinceLastOrder', operator: 'lte', value: 30 }],
    },
  },
  {
    name: 'At-risk',
    nameAr: 'معرض للخطر',
    mode: 'ERP_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'daysSinceLastOrder', operator: 'between', value: [31, 60] }],
    },
  },
  {
    name: 'Lapsed',
    nameAr: 'منقطع',
    mode: 'ERP_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'daysSinceLastOrder', operator: 'between', value: [61, 90] }],
    },
  },
  {
    name: 'Dormant',
    nameAr: 'خامل',
    mode: 'ERP_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'daysSinceLastOrder', operator: 'gt', value: 120 }],
    },
  },
  {
    name: 'VIP',
    nameAr: 'كبار العملاء',
    mode: 'ERP_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'isVip', operator: 'eq', value: true }],
    },
  },
  {
    name: 'One-timers',
    nameAr: 'طلب واحد',
    mode: 'ERP_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'orderCount', operator: 'eq', value: 1 }],
    },
  },
  {
    name: 'Subscription',
    nameAr: 'اشتراك',
    mode: 'ERP_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'isSubscription', operator: 'eq', value: true }],
    },
  },
  {
    name: 'Commercial',
    nameAr: 'تجاري',
    mode: 'ERP_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'isCommercial', operator: 'eq', value: true }],
    },
  },
];

export const PREBUILT_STANDALONE: PrebuiltSegment[] = [
  {
    name: 'New contacts',
    nameAr: 'جهات اتصال جديدة',
    mode: 'STANDALONE_ONLY',
    definition: { logic: 'AND', rules: [{ field: 'createdAt', operator: 'exists' }] },
  },
  {
    name: 'Engaged',
    nameAr: 'متفاعل',
    mode: 'STANDALONE_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'engagementScore', operator: 'gt', value: 0 }],
    },
  },
  {
    name: 'Unengaged 60',
    nameAr: 'غير متفاعل ٦٠',
    mode: 'STANDALONE_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'engagementScore', operator: 'eq', value: 0 }],
    },
  },
  {
    name: 'Unengaged 90',
    nameAr: 'غير متفاعل ٩٠',
    mode: 'STANDALONE_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'engagementScore', operator: 'eq', value: 0 }],
    },
  },
  {
    name: 'Unengaged 120',
    nameAr: 'غير متفاعل ١٢٠',
    mode: 'STANDALONE_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'engagementScore', operator: 'eq', value: 0 }],
    },
  },
  {
    name: 'Website leads',
    nameAr: 'عملاء الموقع',
    mode: 'STANDALONE_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'websiteLead', operator: 'eq', value: true }],
    },
  },
  {
    name: 'WhatsApp opt-ins',
    nameAr: 'موافقات واتساب',
    mode: 'STANDALONE_ONLY',
    definition: {
      logic: 'AND',
      rules: [{ field: 'whatsappOptIn', operator: 'eq', value: true }],
    },
  },
];

export const PREBUILT_BOTH: PrebuiltSegment[] = [
  {
    name: 'Zone-based',
    nameAr: 'حسب المنطقة',
    mode: 'BOTH',
    definition: { logic: 'AND', rules: [{ field: 'zone', operator: 'exists' }] },
  },
  {
    name: 'Arabic speakers',
    nameAr: 'الناطقون بالعربية',
    mode: 'BOTH',
    definition: {
      logic: 'AND',
      rules: [{ field: 'language', operator: 'eq', value: 'ar' }],
    },
  },
  {
    name: 'English speakers',
    nameAr: 'الناطقون بالإنجليزية',
    mode: 'BOTH',
    definition: {
      logic: 'AND',
      rules: [{ field: 'language', operator: 'eq', value: 'en' }],
    },
  },
];

export function allPrebuilt(): PrebuiltSegment[] {
  return [...PREBUILT_ERP, ...PREBUILT_STANDALONE, ...PREBUILT_BOTH];
}
