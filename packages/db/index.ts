import { PrismaClient } from '@prisma/client';
import { bulkInsert } from './src/bulk';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// In a serverless or high-concurrency environment, connection pooling is critical.
// Prisma handles this via the DATABASE_URL (e.g., ?connection_limit=20), but 
// we can also configure it via the client.

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function withTenant<T>(
  tenantId: string,
  fn: (client: PrismaClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId.replace(/'/g, "''")}'`);
    return fn(tx as unknown as PrismaClient);
  });
}

export { bulkInsert };
