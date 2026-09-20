import { describe, expect, it } from 'vitest';
import { resolveCashierZoomBox } from './resolveCashierZoomBox';

describe('resolveCashierZoomBox', () => {
  it('keeps the layout equal to the window at 100%', () => {
    const box = resolveCashierZoomBox(1, 1920, 1080);
    expect(box.width).toBe(1920);
    expect(box.height).toBe(1080);
  });

  it('falls back to 1024×768 when the viewport is not ready yet', () => {
    const box = resolveCashierZoomBox(1, 0, 0);
    expect(box.width).toBe(1024);
    expect(box.height).toBe(768);
  });

  it('shrinks the layout at 120% so zoom still fills the window', () => {
    const box = resolveCashierZoomBox(1.2, 1920, 1080);
    expect(box.width * box.scale).toBeCloseTo(1920);
    expect(box.height * box.scale).toBeCloseTo(1080);
  });

  it('grows the layout at 80% so zoom still fills the window', () => {
    const box = resolveCashierZoomBox(0.8, 1920, 1080);
    expect(box.width * box.scale).toBeCloseTo(1920);
    expect(box.height * box.scale).toBeCloseTo(1080);
  });
});
