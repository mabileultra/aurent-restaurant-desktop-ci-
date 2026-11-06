import { describe, expect, it, vi } from 'vitest';
import {
  createWaterRippleGroup,
  updateWaterRippleGroups,
  renderWaterRippleGroups,
} from './waterRippleEngine';

describe('waterRippleEngine', () => {
  it('creates water ripple group with concentric rings and center droplet', () => {
    const group = createWaterRippleGroup(150, 250, {
      color: '16, 185, 129',
      ringCount: 3,
      maxRadius: 80,
    });

    expect(group.isAlive).toBe(true);
    expect(group.rings).toHaveLength(3);
    expect(group.rings[0].x).toBe(150);
    expect(group.rings[0].y).toBe(250);
    expect(group.rings[0].color).toBe('16, 185, 129');
    expect(group.drop.x).toBe(150);
    expect(group.drop.y).toBe(250);
  });

  it('updates water ripple groups advancing radius and decreasing alpha over time', () => {
    const group = createWaterRippleGroup(100, 100, { maxRadius: 50, speed: 10 });
    let groups = [group];

    // Initial state
    expect(groups).toHaveLength(1);
    expect(groups[0].rings[0].radius).toBe(2);

    // Update 1 step
    groups = updateWaterRippleGroups(groups);
    expect(groups).toHaveLength(1);
    expect(groups[0].rings[0].radius).toBeGreaterThan(2);

    // Run until expired
    for (let i = 0; i < 60; i++) {
      groups = updateWaterRippleGroups(groups);
    }
    expect(groups).toHaveLength(0);
  });

  it('renders water ripple groups to 2D canvas context without crashing', () => {
    const group = createWaterRippleGroup(200, 300);
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 1,
      shadowColor: '',
      shadowBlur: 0,
    };

    renderWaterRippleGroups(mockCtx, [group]);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.arc).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });
});
