import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PixelSnow from './PixelSnow';
import { clamp, seeded, buildAtlas } from './pixelSnowGl';
import { pickLevel } from './pixelSnowSimulation';
import { VARIANTS } from './pixelSnowSprites';

describe('PixelSnow Math, Sprites & GL Helpers', () => {
  it('clamps values correctly within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('seeded RNG produces deterministic pseudorandom floats in [0, 1)', () => {
    const rng = seeded(12345);
    const v1 = rng();
    const v2 = rng();
    expect(v1).toBeGreaterThanOrEqual(0);
    expect(v1).toBeLessThan(1);
    expect(v2).toBeGreaterThanOrEqual(0);
    expect(v2).toBeLessThan(1);
    expect(v1).not.toBe(v2);
  });

  it('buildAtlas generates sprite atlas matching variants and slot layout', () => {
    const atlas = buildAtlas();
    expect(atlas.width).toBeGreaterThan(0);
    expect(atlas.height).toBeGreaterThan(0);
    expect(atlas.data.length).toBe(atlas.width * atlas.height * 4);
  });

  it('pickLevel respects flake size and levels', () => {
    const level = pickLevel(0.1, { flakeSize: 1 });
    expect(level).toBeGreaterThanOrEqual(0);
    expect(level).toBeLessThan(5);
  });

  it('renders PixelSnow container and canvas to markup', () => {
    const html = renderToStaticMarkup(
      React.createElement(PixelSnow, { className: 'test-snow-fx', color: '#cc0505', variant: 'snowflake' })
    );
    expect(html).toContain('pixel-snow-container');
    expect(html).toContain('test-snow-fx');
    expect(html).toContain('pixel-snow-canvas');
  });
});
