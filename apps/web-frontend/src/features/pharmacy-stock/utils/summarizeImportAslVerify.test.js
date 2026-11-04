import { describe, expect, it } from 'vitest';
import { summarizeImportAslVerify } from './summarizeImportAslVerify';

describe('summarizeImportAslVerify', () => {
  it('counts accepted and rejected reasons', () => {
    const summary = summarizeImportAslVerify(
      { L1: [{ code: 'A' }, { code: 'B' }], L2: [] },
      [
        { code: 'X', reason: 'notFound' },
        { code: 'Y', reason: 'alreadySold' },
        { code: 'Z', reason: 'error' },
        { code: 'W', reason: 'weird' },
      ],
    );

    expect(summary.acceptedCount).toBe(2);
    expect(summary.rejectedCount).toBe(4);
    expect(summary.notFoundCount).toBe(1);
    expect(summary.alreadySoldCount).toBe(1);
    expect(summary.errorCount).toBe(2);
  });
});
