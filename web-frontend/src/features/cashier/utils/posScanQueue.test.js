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

  it('keeps a long burst within default maxPending (24)', async () => {
    const queue = createPosScanQueue();
    const seen = [];
    let release;
    const gate = new Promise((r) => {
      release = r;
    });
    const process = vi.fn(async (code) => {
      if (code === '0') await gate;
      seen.push(code);
    });

    queue.enqueue('0', {}, process);
    for (let i = 1; i <= 20; i += 1) {
      queue.enqueue(String(i), {}, process);
    }
    expect(queue.size).toBe(20);
    release();
    await vi.waitFor(() => expect(seen.length).toBe(21));
    expect(seen[0]).toBe('0');
    expect(seen[20]).toBe('20');
  });
});
