import { prisma } from '@lmms/db';
import { MockWhatsAppAdapter, CloudApiWhatsAppAdapter, type WhatsAppAdapter } from './adapter';

export async function createWhatsAppAdapterForTenant(tenantId: string): Promise<WhatsAppAdapter> {
  const config = await prisma.whatsAppConfig.findUnique({
    where: { tenantId },
  });

  if (!config || config.status !== 'CONNECTED') {
    return new MockWhatsAppAdapter();
  }

  return new CloudApiWhatsAppAdapter(config.phoneNumberId, config.accessToken);
}
