import { prisma } from '@lmms/db';
import { ALL_AUTOMATIONS } from './catalog';

export async function seedAutomations(tenantId: string): Promise<number> {
  for (const def of ALL_AUTOMATIONS) {
    await prisma.automation.upsert({
      where: { tenantId_slug: { tenantId, slug: def.slug } },
      update: {
        name: def.name,
        nameAr: def.nameAr,
        mode: def.mode,
        priority: def.priority,
        definition: def.trigger as never,
        frequencyCapHours: def.frequencyCapHours,
      },
      create: {
        tenantId,
        slug: def.slug,
        name: def.name,
        nameAr: def.nameAr,
        mode: def.mode,
        priority: def.priority,
        definition: def.trigger as never,
        frequencyCapHours: def.frequencyCapHours,
      },
    });
  }
  return ALL_AUTOMATIONS.length;
}
