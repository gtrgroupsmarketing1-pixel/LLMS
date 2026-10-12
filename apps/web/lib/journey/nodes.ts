export interface NodeMeta {
  label: string;
  labelAr: string;
  color: string;
  bg: string;
  border: string;
}

export const NODE_META: Record<string, NodeMeta> = {
  TRIGGER: {
    label: 'Trigger',
    labelAr: 'المُشغِّل',
    color: '#7c3aed',
    bg: '#ede9fe',
    border: '#c4b5fd',
  },
  WAIT: {
    label: 'Wait',
    labelAr: 'انتظار',
    color: '#0891b2',
    bg: '#cffafe',
    border: '#67e8f9',
  },
  CONDITION: {
    label: 'Condition',
    labelAr: 'شرط',
    color: '#ca8a04',
    bg: '#fef9c3',
    border: '#fde047',
  },
  SEND: {
    label: 'Send',
    labelAr: 'إرسال',
    color: '#16a34a',
    bg: '#dcfce7',
    border: '#86efac',
  },
  SPLIT: {
    label: 'Split',
    labelAr: 'تقسيم',
    color: '#db2777',
    bg: '#fce7f3',
    border: '#f9a8d4',
  },
  END: {
    label: 'End',
    labelAr: 'نهاية',
    color: '#475569',
    bg: '#e2e8f0',
    border: '#94a3b8',
  },
};

export const TRIGGER_TYPES = [
  'ORDER_DELIVERED',
  'NEW_CUSTOMER',
  'PROMO_SENT_NOT_REDEEMED',
  'DAYS_SINCE_LAST_ORDER',
  'DAYS_SINCE_LAST_ENGAGEMENT',
  'REVIEW_POSTED',
  'AD_SPEND_THRESHOLD',
  'TEMPLATE_REJECTED',
  'ERP_SYNC_FAILED',
  'CSV_IMPORT_COMPLETED',
  'BIRTHDAY',
  'SUBSCRIPTION_RENEWAL_SOON',
  'ANNIVERSARY',
] as const;

export const WAIT_UNITS = ['MINUTES', 'HOURS', 'DAYS'] as const;
