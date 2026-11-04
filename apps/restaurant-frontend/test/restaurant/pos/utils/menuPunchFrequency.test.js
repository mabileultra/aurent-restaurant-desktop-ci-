import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  familyPunchScore,
  localDayKey,
  previousLocalDayKey,
  readMenuPunchMap,
  readMenuPunchStore,
  recordMenuPunch,
  POPULAR_THRESHOLD,
} from '../../../../src/restaurant/pos/utils/menuPunchFrequency';

const STORE = 3;

beforeEach(() => {
  const mem = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('menuPunchFrequency', () => {
  it('records into today bucket and does not affect ranking map the same day', () => {
    const now = new Date(2026, 9, 5, 14, 0, 0); // local Oct 5
    recordMenuPunch(STORE, 'cola', 20, now);

    const store = readMenuPunchStore(STORE);
    expect(store[localDayKey(now)].cola).toBe(20);
    expect(readMenuPunchMap(STORE, now)).toEqual({});
  });

  it('ranks by previous calendar day only', () => {
    const dayA = new Date(2026, 9, 4, 18, 0, 0);
    const dayB = new Date(2026, 9, 5, 10, 0, 0);
    recordMenuPunch(STORE, 'bread', 23, dayA);
    recordMenuPunch(STORE, 'cola', 15, dayA);
    recordMenuPunch(STORE, 'cola', 3, dayB);

    const map = readMenuPunchMap(STORE, dayB);
    expect(map).toEqual({ bread: 23, cola: 15 });
    expect(map.cola).not.toBe(18);
    expect(previousLocalDayKey(dayB)).toBe(localDayKey(dayA));
  });

  it('keeps catalog order when yesterday count is below threshold', () => {
    const family = { key: 'milk', variants: [] };
    expect(familyPunchScore(family, { milk: POPULAR_THRESHOLD - 1 })).toBe(0);
    expect(familyPunchScore(family, { milk: POPULAR_THRESHOLD })).toBe(POPULAR_THRESHOLD);
  });

  it('migrates legacy flat map into a day bucket', () => {
    localStorage.setItem(`rst-menu-punch:${STORE}`, JSON.stringify({ cola: 9 }));
    const store = readMenuPunchStore(STORE);
    const today = localDayKey();
    expect(store[today].cola).toBe(9);
  });

  it('same-day spam does not change ranking until next day', () => {
    const day1 = new Date(2026, 9, 5, 9, 0, 0);
    const day2 = new Date(2026, 9, 6, 9, 0, 0);
    for (let i = 0; i < 20; i += 1) recordMenuPunch(STORE, 'C', 1, day1);
    expect(readMenuPunchMap(STORE, day1)).toEqual({});
    expect(readMenuPunchMap(STORE, day2)).toEqual({ C: 20 });
  });
});
