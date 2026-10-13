export interface SopStep {
  key: string;
  label: string;
  labelAr?: string;
  required: boolean;
}

export interface SopDefinition {
  key: string;
  title: string;
  titleAr: string;
  category: 'ONBOARDING' | 'CAMPAIGN_LAUNCH' | 'CONTENT_REVIEW' | 'COMPLIANCE' | 'BILLING' | 'MIGRATION' | 'REVIEW_MANAGEMENT' | 'GENERAL';
  steps: SopStep[];
}

export const SOP_LIBRARY: SopDefinition[] = [
  {
    key: 'client_onboarding_erp',
    title: 'ERP-Connected client onboarding',
    titleAr: 'إعداد العميل المتصل بنظام ERP',
    category: 'ONBOARDING',
    steps: [
      { key: 'create_tenant', label: 'Create tenant in LMMS', required: true },
      { key: 'connect_erp', label: 'Connect ERP credentials', required: true },
      { key: 'validate_sync', label: 'Validate initial sync', required: true },
      { key: 'upload_brand', label: 'Upload brand assets', required: true },
      { key: 'consent_rules', label: 'Configure consent rules per country', required: true },
      { key: 'assign_package', label: 'Assign package and services', required: true },
      { key: 'activate', label: 'Activate tenant and notify client', required: true },
    ],
  },
  {
    key: 'client_onboarding_standalone',
    title: 'Standalone client onboarding',
    titleAr: 'إعداد العميل المستقل',
    category: 'ONBOARDING',
    steps: [
      { key: 'create_tenant', label: 'Create tenant in Standalone mode', required: true },
      { key: 'upload_csv', label: 'Upload customer CSV', required: true },
      { key: 'resolve_consent', label: 'Resolve consent gaps', required: true },
      { key: 'upload_brand', label: 'Upload brand assets', required: true },
      { key: 'consent_rules', label: 'Configure consent rules', required: true },
      { key: 'assign_package', label: 'Assign package and services', required: true },
      { key: 'activate', label: 'Activate tenant and notify client', required: true },
    ],
  },
  {
    key: 'campaign_launch',
    title: 'Campaign launch checklist',
    titleAr: 'قائمة إطلاق الحملة',
    category: 'CAMPAIGN_LAUNCH',
    steps: [
      { key: 'segment_selected', label: 'Segment selected and previewed', required: true },
      { key: 'template_approved', label: 'Template approved by Meta', required: true },
      { key: 'consent_validated', label: 'Consent validation passed', required: true },
      { key: 'promo_utm', label: 'Promo code and UTM generated', required: true },
      { key: 'client_approval', label: 'Client approval received', required: true },
      { key: 'scheduled', label: 'Send scheduled', required: true },
    ],
  },
  {
    key: 'content_review_cycle',
    title: 'Content review cycle',
    titleAr: 'دورة مراجعة المحتوى',
    category: 'CONTENT_REVIEW',
    steps: [
      { key: 'brief_written', label: 'Brief written', required: true },
      { key: 'ar_en_copies', label: 'Arabic and English copies drafted', required: true },
      { key: 'internal_review', label: 'Internal review passed', required: true },
      { key: 'client_review', label: 'Client review link sent', required: true },
      { key: 'decision', label: 'Client approved or rejected', required: true },
    ],
  },
  {
    key: 'compliance_daily',
    title: 'Daily compliance check',
    titleAr: 'التحقق اليومي من الامتثال',
    category: 'COMPLIANCE',
    steps: [
      { key: 'audit_chain', label: 'Audit chain integrity check', required: true },
      { key: 'dnc_list', label: 'DNC list reviewed', required: true },
      { key: 'opt_outs', label: 'Opt-out propagation SLA verified', required: true },
      { key: 'erasure_queue', label: 'Erasure queue reviewed', required: false },
      { key: 'sender_ids', label: 'SMS sender IDs up to date', required: false },
    ],
  },
  {
    key: 'billing_monthly',
    title: 'Monthly billing cycle',
    titleAr: 'دورة الفوترة الشهرية',
    category: 'BILLING',
    steps: [
      { key: 'usage_review', label: 'Review usage for overages', required: true },
      { key: 'generate_invoice', label: 'Generate invoice with VAT', required: true },
      { key: 'send_invoice', label: 'Send invoice to client', required: true },
      { key: 'dunning_schedule', label: 'Confirm dunning schedule active', required: true },
    ],
  },
  {
    key: 'migration_standalone_to_erp',
    title: 'Standalone → ERP migration',
    titleAr: 'الترحيل من المستقل إلى ERP',
    category: 'MIGRATION',
    steps: [
      { key: 'snapshot', label: 'Pre-migration snapshot captured', required: true },
      { key: 'match_customers', label: 'Customer matching completed', required: true },
      { key: 'unmatched_review', label: 'Unmatched queue resolved', required: true },
      { key: 'backfill_orders', label: 'Historical orders backfilled', required: true },
      { key: 'flip_mode', label: 'Mode set to ERP-Connected', required: true },
      { key: 'verify_rollback', label: 'Rollback path verified', required: true },
    ],
  },
  {
    key: 'review_response',
    title: 'Review response handling',
    titleAr: 'معالجة الردود على التقييمات',
    category: 'REVIEW_MANAGEMENT',
    steps: [
      { key: 'tag_sentiment', label: 'Sentiment tagged', required: true },
      { key: 'draft_response', label: 'Response drafted (AR or EN)', required: true },
      { key: 'human_approval', label: 'Human approval received', required: true },
      { key: 'posted', label: 'Response posted to platform', required: true },
      { key: 'escalation_check', label: 'Escalation required? Reviewed', required: false },
    ],
  },
];

export function getSop(key: string): SopDefinition | undefined {
  return SOP_LIBRARY.find((s) => s.key === key);
}

export function sopsForCategory(category: string): SopDefinition[] {
  return SOP_LIBRARY.filter((s) => s.category === category);
}
