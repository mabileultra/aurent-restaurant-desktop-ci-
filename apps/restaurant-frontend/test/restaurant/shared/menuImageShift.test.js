import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getImageBlob = vi.fn();

vi.mock('../../../src/restaurant/api/menu.api', () => ({
  rstMenuApi: {
    getImageBlob: (...args) => getImageBlob(...args),
  },
}));

import { peekMenuImageSrc, menuImageShiftMode } from '../../../src/restaurant/shared/utils/menuImageShiftCache';
import { popMenuImageBusy, pushMenuImageBusy } from '../../../src/restaurant/shared/utils/menuImageLoadQueue';
import {
  preloadMenuImages,
  stopMenuImageShift,
  syncMenuImageShift,
} from '../../../src/restaurant/shared/utils/menuImageShiftPreload';
import { loadMenuImageBlob } from '../../../src/restaurant/shared/utils/menuImageLoadQueue';

const pending = [];

function dish(id) {
  return { imageUrl: `aurent-menu-img:${id}` };
}

function dishes(count, prefix = 'd') {
  return Array.from({ length: count }, (_, index) => dish(`${prefix}${index}`));
}

async function flush() {
  for (let step = 0; step < 6; step += 1) {
    await Promise.resolve();
  }
}

beforeEach(() => {
  let seq = 0;
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => {
      seq += 1;
      return `blob:menu-${seq}`;
    }),
    revokeObjectURL: vi.fn(),
  });
  getImageBlob.mockImplementation((id) => new Promise((resolve) => {
    pending.push({ id, resolve });
  }));
});

afterEach(async () => {
  stopMenuImageShift();
  for (let step = 0; step < 8; step += 1) popMenuImageBusy();
  pending.splice(0).forEach((row) => row.resolve(null));
  await flush();
  vi.unstubAllGlobals();
  getImageBlob.mockReset();
});

describe('menu photo shift preload', () => {
  it('downloads at most four photos at a time', async () => {
    syncMenuImageShift('shift-1', dishes(10));
    expect(getImageBlob).toHaveBeenCalledTimes(4);

    pending[0].resolve({ id: pending[0].id });
    await flush();

    expect(getImageBlob).toHaveBeenCalledTimes(5);
    expect(peekMenuImageSrc('d0')).toMatch(/^blob:menu-/);
    expect(menuImageShiftMode()).toBe('open');
  });

  it('does not start downloads while pay or print is busy', async () => {
    pushMenuImageBusy();
    syncMenuImageShift('shift-2', dishes(6, 'b'));
    expect(getImageBlob).not.toHaveBeenCalled();

    popMenuImageBusy();
    expect(getImageBlob).toHaveBeenCalledTimes(4);
  });

  it('does not fetch again for a photo already kept in the shift', async () => {
    syncMenuImageShift('shift-3', [dish('same'), dish('same'), dish('same')]);
    expect(getImageBlob).toHaveBeenCalledTimes(1);
    pending[0].resolve({ id: 'same' });
    await flush();

    const calls = getImageBlob.mock.calls.length;
    syncMenuImageShift('shift-3', [dish('same'), dish('other')]);
    expect(getImageBlob).toHaveBeenCalledTimes(calls + 1);
    expect(peekMenuImageSrc('same')).toMatch(/^blob:menu-/);
  });

  it('drops the queue and refuses loads after the shift closes', async () => {
    syncMenuImageShift('shift-4', dishes(8, 'c'));
    expect(getImageBlob).toHaveBeenCalledTimes(4);

    syncMenuImageShift(null, dishes(8, 'c'));
    expect(menuImageShiftMode()).toBe('closed');
    expect(peekMenuImageSrc('c0')).toBe('');

    pending.splice(0).forEach((row) => row.resolve({ id: row.id }));
    await flush();
    expect(getImageBlob).toHaveBeenCalledTimes(4);
    expect(peekMenuImageSrc('c0')).toBe('');

    getImageBlob.mockClear();
    await expect(loadMenuImageBlob('c0')).resolves.toBeNull();
    expect(getImageBlob).not.toHaveBeenCalled();
  });

  it('does not call the image API for 5000 dishes after the shift is closed', async () => {
    syncMenuImageShift(null, []);
    getImageBlob.mockClear();
    preloadMenuImages(dishes(5000, 'peak'));
    const results = await Promise.all(
      Array.from({ length: 5000 }, (_, index) => loadMenuImageBlob(`peak${index}`)),
    );
    expect(results.every((row) => row === null)).toBe(true);
    expect(getImageBlob).not.toHaveBeenCalled();
  });

  it('discards in-flight bytes when the shift ends before they arrive', async () => {
    syncMenuImageShift('shift-5', dishes(4, 'e'));
    expect(getImageBlob).toHaveBeenCalledTimes(4);
    stopMenuImageShift();
    pending.splice(0).forEach((row) => row.resolve({ id: row.id }));
    await flush();
    expect(peekMenuImageSrc('e0')).toBe('');
    expect(menuImageShiftMode()).toBe('idle');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
