import { describe, expect, it } from 'vitest';
import { APP_TOAST_BASE_STYLE, APP_TOASTER_CONTAINER_STYLE } from './toasterLayout';

describe('toasterLayout', () => {
  it('keeps the toaster inside the window inset', () => {
    expect(APP_TOASTER_CONTAINER_STYLE.inset).toBe(12);
    expect(APP_TOASTER_CONTAINER_STYLE.overflow).toBe('hidden');
  });

  it('caps toast width to the viewport instead of growing with long names', () => {
    expect(APP_TOAST_BASE_STYLE.maxWidth).toBe('min(420px, calc(100vw - 24px))');
    expect(APP_TOAST_BASE_STYLE.overflow).toBe('hidden');
  });
});
