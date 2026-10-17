import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@lmms/db';

type Region = 'UAE' | 'KSA';

const regionalClients = new Map<Region, PrismaClient>();

/**
 * Returns a Prisma client connected to the database for the given region.
 * 
 * If the region is UAE, it returns the default global prisma client.
 * If the region is KSA, it looks for DATABASE_URL_KSA. If not found, it falls
 * back to the default client and logs a warning (useful for local dev/CI).
 */
export function getRegionalPrisma(region: Region): PrismaClient {
  if (region === 'UAE') {
    return defaultPrisma;
  }

  if (regionalClients.has(region)) {
    return regionalClients.get(region)!;
  }

  const ksaUrl = process.env.DATABASE_URL_KSA;
  if (!ksaUrl) {
    console.warn('[residency] DATABASE_URL_KSA missing, falling back to default UAE DB');
    return defaultPrisma;
  }

  const client = new PrismaClient({
    datasourceUrl: ksaUrl,
  });

  regionalClients.set(region, client);
  return client;
}
