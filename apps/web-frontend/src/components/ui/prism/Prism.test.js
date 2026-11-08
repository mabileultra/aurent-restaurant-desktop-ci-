import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Prism from './Prism';
import { clamp, rotation, multiply, calcPrismOrientation } from './prismMath';
import { syncPalette } from './prismPaletteUtils';

describe('Prism Math & Utils', () => {
  it('clamps values correctly within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('calculates 3x3 rotation matrix', () => {
    const mat = rotation(0, 0, 0);
    expect(mat).toHaveLength(9);
    // Identity-like: [1, 0, -0, -0, 1, 0, 0, -0, 1]
    expect(mat[0]).toBeCloseTo(1);
    expect(mat[4]).toBeCloseTo(1);
    expect(mat[8]).toBeCloseTo(1);
  });

  it('multiplies two 3x3 matrices', () => {
    const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const a = [2, 0, 0, 0, 2, 0, 0, 0, 2];
    const res = multiply(identity, a);
    expect(res).toEqual([2, 0, 0, 0, 2, 0, 0, 0, 2]);
  });

  it('computes prism orientation for rotate and 3drotate modes', () => {
    const pose = { yaw: 0, pitch: 0, roll: 0 };
    const sRotate = { animationType: 'rotate', timeScale: 0.5 };
    const mat1 = calcPrismOrientation(1, sRotate, pose);
    expect(mat1).toHaveLength(9);

    const s3d = { animationType: '3drotate', timeScale: 0.5 };
    const mat2 = calcPrismOrientation(1, s3d, pose);
    expect(mat2).toHaveLength(9);

    const sStatic = { animationType: 'static', timeScale: 0.5 };
    const mat3 = calcPrismOrientation(1, sStatic, pose);
    expect(mat3).toHaveLength(9);
  });

  it('syncPalette handles empty colors and updates tracker', () => {
    const gl = {
      bindTexture: vi.fn(),
      texSubImage2D: vi.fn(),
      TEXTURE_2D: 3553,
      RGBA: 6408,
      UNSIGNED_BYTE: 5121,
    };
    const tracker = { paletteKey: '', neutral: 0 };
    syncPalette(gl, {}, [], null, tracker);
    expect(tracker.paletteKey).toBe('');
  });
});

describe('Prism Component', () => {
  it('renders container and canvas with default props', () => {
    const html = renderToStaticMarkup(React.createElement(Prism));
    expect(html).toContain('prism');
    expect(html).toContain('prism-canvas');
  });

  it('applies custom className and style', () => {
    const html = renderToStaticMarkup(
      React.createElement(Prism, {
        className: 'custom-prism-test',
        style: { width: '100px', height: '100px' },
      })
    );
    expect(html).toContain('custom-prism-test');
    expect(html).toContain('width:100px');
  });
});
