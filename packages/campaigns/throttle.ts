export interface ThrottleOptions {
  ratePerSecond: number;
}

export async function* throttle<T>(
  items: T[],
  opts: ThrottleOptions,
): AsyncGenerator<T> {
  const windowMs = 1000;
  const batchSize = Math.max(1, opts.ratePerSecond);
  let count = 0;
  const start = Date.now();

  for (const item of items) {
    yield item;
    count += 1;
    if (count >= batchSize) {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, windowMs - (elapsed % windowMs));
      if (wait > 0) {
        await new Promise((r) => setTimeout(r, wait));
      }
      count = 0;
    }
  }
}
