import { prisma } from '@lmms/db';
import { createProcessingActivity } from './processing-registry';
import { publishPrivacyPolicy, getLatestPrivacyPolicy } from './privacy-policy';

export async function seedComplianceDefaults() {
  // 1. Seed default global processing activities
  const existingActivities = await prisma.processingActivity.count({
    where: { tenantId: null },
  });

  if (existingActivities === 0) {
    const defaultActivities = [
      {
        name: 'Marketing Campaigns',
        purpose: 'Sending promotional offers and updates',
        dataCategories: ['phone', 'name', 'order_history', 'zone'],
        legalBasis: 'CONSENT',
        retentionDays: 730,
      },
      {
        name: 'Order Fulfillment',
        purpose: 'Executing laundry orders',
        dataCategories: ['phone', 'name', 'address', 'order_history'],
        legalBasis: 'CONTRACT',
        retentionDays: 1825,
      },
      {
        name: 'Review Management',
        purpose: 'Responding to customer reviews',
        dataCategories: ['name', 'review_text'],
        legalBasis: 'LEGITIMATE_INTEREST',
        retentionDays: 730,
      },
    ];

    for (const act of defaultActivities) {
      await createProcessingActivity(act);
    }
  }

  // 2. Seed an initial privacy policy if none exists
  const existingPolicy = await getLatestPrivacyPolicy();
  if (!existingPolicy) {
    await publishPrivacyPolicy({
      version: '2026-v1',
      contentEn: '# LMMS Privacy Policy\n\nWe respect your privacy...',
      contentAr: '# سياسة الخصوصية\n\nنحن نحترم خصوصيتك...',
    });
  }

  return { success: true };
}
