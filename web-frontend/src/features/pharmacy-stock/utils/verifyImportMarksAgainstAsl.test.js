import { describe, expect, it, vi } from 'vitest';
import { summarizeImportAslVerify } from './summarizeImportAslVerify';
import {
  countImportMarks,
  estimateImportVerifySeconds,
  verifyImportMarksAgainstAsl,
} from './verifyImportMarksAgainstAsl';

describe('verifyImportMarksAgainstAsl', () => {
  it('counts marks', () => {
    expect(countImportMarks({ a: [{ code: '1' }, { code: '2' }], b: [{ code: '3' }] })).toBe(3);
  });

  it('estimates duration for large batches', () => {
    expect(estimateImportVerifySeconds(0)).toBe(0);
    expect(estimateImportVerifySeconds(40, 4)).toBeGreaterThan(5);
  });

  it('checks every code and splits accepted vs rejected precisely', async () => {
    const progress = [];
    const verifyMarking = vi.fn(async ({ code }) => {
      await Promise.resolve();
      if (code === 'OK') return { found: true, status: 'INTRODUCED' };
      if (code === 'SOLD') return { found: true, alreadySold: true };
      if (code === 'MISS') return { found: false };
      throw new Error('boom');
    });

    const { accepted, rejected, total, done } = await verifyImportMarksAgainstAsl({
      storeId: 5,
      concurrency: 2,
      byLineId: {
        L1: [{ code: 'OK' }, { code: 'SOLD' }],
        L2: [{ code: 'MISS' }, { code: 'ERR' }],
      },
      verifyMarking,
      onProgress: (p) => progress.push(p),
    });

    expect(accepted.L1).toEqual([{ code: 'OK', aslStatus: 'INTRODUCED' }]);
    expect(accepted.L2).toEqual([]);
    expect(rejected.map((r) => r.reason)).toEqual(['alreadySold', 'notFound', 'error']);
    expect(verifyMarking).toHaveBeenCalledTimes(4);
    expect(total).toBe(4);
    expect(done).toBe(4);
    expect(progress.at(-1)).toMatchObject({ done: 4, total: 4 });

    expect(summarizeImportAslVerify(accepted, rejected)).toEqual({
      acceptedCount: 1,
      rejectedCount: 3,
      notFoundCount: 1,
      alreadySoldCount: 1,
      errorCount: 1,
      rejected,
    });
  });
});
