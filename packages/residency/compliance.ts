import { prisma } from '@lmms/db';

type Region = 'UAE' | 'KSA';

export interface RegionComplianceResult {
  allowed: boolean;
  reason?: string;
  tenantRegion?: string;
}

/**
 * Validates that a tenant's assigned region matches the requested resource region.
 * Used to prevent cross-region data leaks.
 */
export async function checkRegionCompliance(
  tenantId: string,
  requestedRegion: Region,
): Promise<RegionComplianceResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { region: true },
  });

  if (!tenant) {
    return { allowed: false, reason: 'tenant_not_found' };
  }

  if (tenant.region !== requestedRegion) {
    return {
      allowed: false,
      reason: 'region_mismatch',
      tenantRegion: tenant.region,
    };
  }

  return { allowed: true, tenantRegion: tenant.region };
}

export async function assertRegion(tenantId: string, requestedRegion: Region): Promise<void> {
  const result = await checkRegionCompliance(tenantId, requestedRegion);
  if (!result.allowed) {
    throw new Error(`region_compliance_failed:${result.reason}`);
  }
}
