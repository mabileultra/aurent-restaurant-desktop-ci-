import { describe, expect, it, vi } from 'vitest';
import { createPosScanQueue } from './posScanQueue';

describe('createPosScanQueue', () => {
  it('processes queued scans in order after the first finishes', async () => {
    const seen = [];
    const queue = createPosScanQueue({ maxPending: 2 });
    let release;
    const gate = new Promise((r) => {
      release = r;
    });

    const process = vi.fn(async (code) => {
      seen.push(`start:${code}`);
      if (code === 'a') await gate;
      seen.push(`end:${code}`);
    });

    const first = queue.enqueue('a', {}, process);
    queue.enqueue('b', {}, process);
    expect(seen).toEqual(['start:a']);
    release();
    await first;
    await vi.waitFor(() => expect(seen).toEqual(['start:a', 'end:a', 'start:b', 'end:b']));
  });
});
