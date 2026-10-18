import { PrismaClient } from '@prisma/client';

/**
 * Efficiently inserts large amounts of data by chunking.
 * Prevents the query parameter limit from being exceeded.
 */
export async function bulkInsert<T>(
  client: PrismaClient,
  modelName: string,
  data: T[],
  chunkSize = 1000,
): Promise<number> {
  let inserted = 0;
  // Use bracket notation to access dynamic models
  const model = (client as any)[modelName];

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await model.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    inserted += chunk.length;
  }

  return inserted;
}
