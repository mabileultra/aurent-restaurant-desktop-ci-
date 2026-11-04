import { describe, expect, it } from 'vitest';
import { resolveImportMarksAskMode } from './resolveImportMarksAskMode';

describe('resolveImportMarksAskMode', () => {
  it('stays idle until dialog open and ASL status known', () => {
    expect(resolveImportMarksAskMode({ askOpen: false, aslReady: true })).toBe('idle');
    expect(resolveImportMarksAskMode({ askOpen: true, aslReady: false })).toBe('idle');
  });

  it('shows no-asl when integration is off', () => {
    expect(
      resolveImportMarksAskMode({
        askOpen: true,
        aslReady: true,
        aslEnabled: false,
      }),
    ).toBe('no-asl');
  });

  it('asks to verify when ASL is on', () => {
    expect(
      resolveImportMarksAskMode({
        askOpen: true,
        aslReady: true,
        aslEnabled: true,
      }),
    ).toBe('ask');
  });

  it('prefers verifying / result over ask', () => {
    expect(
      resolveImportMarksAskMode({
        askOpen: true,
        aslReady: true,
        aslEnabled: true,
        verifying: true,
      }),
    ).toBe('verifying');
    expect(
      resolveImportMarksAskMode({
        askOpen: true,
        aslReady: true,
        aslEnabled: false,
        hasResult: true,
      }),
    ).toBe('result');
  });
});
