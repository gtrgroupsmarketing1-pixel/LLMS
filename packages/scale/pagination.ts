/**
 * Cursor-based pagination utilities.
 * Offsets become very slow on large tables (e.g., 1M messages).
 * Cursors are O(1) and scale perfectly.
 */

export interface CursorPage {
  cursor: string | null;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('ascii');
}

/**
 * Generic pagination helper for Prisma.
 * Assumes the model has an `id` field.
 */
export async function paginate<T extends { id: string }>(
  model: any, // Prisma model delegate
  args: any,  // Prisma findMany args
  page: CursorPage,
): Promise<PaginatedResult<T>> {
  const limit = Math.min(Math.max(page.limit, 1), 100); // Enforce max 100
  const cursorId = page.cursor ? decodeCursor(page.cursor) : null;

  const queryArgs = {
    ...args,
    take: limit + 1, // Fetch one extra to determine hasMore
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
  };

  const results: T[] = await model.findMany(queryArgs);

  let hasMore = false;
  let nextCursor: string | null = null;

  if (results.length > limit) {
    hasMore = true;
    results.pop(); // Remove the extra item
  }

  if (results.length > 0) {
    nextCursor = encodeCursor(results[results.length - 1].id);
  }

  return {
    data: results,
    nextCursor,
    hasMore,
  };
}
