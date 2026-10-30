// Runs `fn` on every item, but at most `limit` at the same time, and returns the results in the same order.
// Why: downloading 400 files one by one is slow, but starting all 400 at once would flood GitHub.
// 8 at a time is a good middle ground.
//
// How: we start `limit` "workers". Each worker takes the next item that nobody has taken yet,
// waits for it to finish, then takes another, until no items are left.
// If `fn` throws, the whole call fails, so `fn` should catch errors it can recover from.
export const mapLimit = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let nextIndex = 0; // the next item nobody has started yet

  const worker = async () => {
    while (nextIndex < items.length) {
      // Safe without locks: JavaScript runs one line at a time, so two workers can't grab the same index.
      const index = nextIndex++;
      results[index] = await fn(items[index], index); // store by index, so order is kept
    }
  };

  // Start the workers and wait until all of them run out of items.
  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
};
