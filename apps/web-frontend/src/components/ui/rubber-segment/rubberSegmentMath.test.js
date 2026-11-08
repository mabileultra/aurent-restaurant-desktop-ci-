import { describe, expect, it } from 'vitest';
import { clamp, rubber, project, velocityOf, nearestSlot } from './rubberSegmentMath';

describe('rubberSegmentMath', () => {
  it('clamps values properly', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('computes rubber band effect with dampening', () => {
    const val = rubber(10, 100);
    expect(val).toBeGreaterThan(0);
    expect(val).toBeLessThan(10);
  });

  it('projects momentum with glide factor', () => {
    const proj = project(500, 75);
    expect(proj).toBeGreaterThan(0);
  });

  it('calculates velocity from movement history', () => {
    const hist = [
      [100, 10],
      [150, 60],
    ];
    const v = velocityOf(hist, 150);
    expect(v).toBe(1000); // (60 - 10) / (150 - 100) * 1000 = 1000 px/s
  });

  it('finds nearest slot', () => {
    const slots = [
      { l: 0, r: 50 },    // center 25
      { l: 50, r: 100 },  // center 75
      { l: 100, r: 150 }, // center 125
    ];
    expect(nearestSlot(slots, 20)).toBe(0);
    expect(nearestSlot(slots, 70)).toBe(1);
    expect(nearestSlot(slots, 130)).toBe(2);
  });
});
