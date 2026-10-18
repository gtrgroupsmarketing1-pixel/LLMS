import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { MODULE_CATALOG } from './catalog';
import { canEnableModule, canDisableModule } from './validate';

export async function seedModuleDefinitions() {
  let count = 0;
  for (const mod of MODULE_CATALOG) {
    const existing = await prisma.moduleDefinition.findUnique({
      where: { key: mod.key },
    });
    if (!existing) {
      await prisma.moduleDefinition.create({
        data: {
          key: mod.key,
          name: mod.name,
          description: mod.description,
          isCore: mod.isCore,
          dependencies: mod.dependencies as never,
        },
      });
      count++;
    }
  }
  return count;
}

/**
 * Initializes a brand new tenant with the core modules enabled.
 */
export async function provisionTenantModules(tenantId: string) {
  const coreModules = MODULE_CATALOG.filter((m) => m.isCore);
  
  for (const mod of coreModules) {
    await prisma.tenantModule.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey: mod.key } },
      update: { enabled: true },
      create: { tenantId, moduleKey: mod.key, enabled: true },
    });
  }
}

export async function getTenantModules(tenantId: string) {
  const records = await prisma.tenantModule.findMany({
    where: { tenantId },
  });

  const activeKeys = records.filter((r) => r.enabled).map((r) => r.moduleKey);

  return MODULE_CATALOG.map((def) => ({
    ...def,
    enabled: activeKeys.includes(def.key),
  }));
}

export async function isModuleEnabled(tenantId: string, moduleKey: string): Promise<boolean> {
  const def = MODULE_CATALOG.find((m) => m.key === moduleKey);
  if (!def) return false;
  if (def.isCore) return true; // Core is always on

  const record = await prisma.tenantModule.findUnique({
    where: { tenantId_moduleKey: { tenantId, moduleKey } },
  });
  return record?.enabled ?? false;
}

export async function toggleModule(
  tenantId: string,
  moduleKey: string,
  enabled: boolean,
  actorId: string,
) {
  const activeRecords = await prisma.tenantModule.findMany({
    where: { tenantId, enabled: true },
  });
  const activeKeys = activeRecords.map((r) => r.moduleKey);

  if (enabled) {
    const check = canEnableModule(moduleKey, activeKeys);
    if (!check.valid) throw new Error(`cannot_enable:${check.reason}`);
  } else {
    const check = canDisableModule(moduleKey, activeKeys);
    if (!check.valid) throw new Error(`cannot_disable:${check.reason}`);
  }

  const record = await prisma.tenantModule.upsert({
    where: { tenantId_moduleKey: { tenantId, moduleKey } },
    update: { enabled },
    create: { tenantId, moduleKey, enabled },
  });

  await logAudit(
    tenantId,
    actorId,
    enabled ? 'module.enable' : 'module.disable',
    `module:${moduleKey}`,
  );

  return record;
}
