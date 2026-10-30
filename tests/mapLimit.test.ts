// Tests for lib/mapLimit.ts: results stay in order, and never more than `limit` jobs run at once.
import { describe, expect, it } from "vitest";
import { mapLimit } from "@/lib/mapLimit";

// Waits for `ms` milliseconds.
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("mapLimit", () => {
  it("keeps the original order, even when later items finish first", async () => {
    // Item 0 is the slowest, item 4 the fastest.
    const results = await mapLimit([0, 1, 2, 3, 4], 3, async (n) => {
      await wait(25 - n * 5);
      return n * 10;
    });
    expect(results).toEqual([0, 10, 20, 30, 40]);
  });

  it("never runs more than `limit` jobs at the same time", async () => {
    let running = 0;
    let mostAtOnce = 0;

    await mapLimit(Array.from({ length: 20 }, (_, i) => i), 4, async () => {
      running++;
      mostAtOnce = Math.max(mostAtOnce, running);
      await wait(2);
      running--;
    });

    expect(mostAtOnce).toBe(4);
  });

  it("works with an empty list", async () => {
    expect(await mapLimit([], 8, async (x) => x)).toEqual([]);
  });
});
