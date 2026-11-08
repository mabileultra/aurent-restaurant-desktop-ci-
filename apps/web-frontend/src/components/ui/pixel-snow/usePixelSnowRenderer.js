import { useEffect, useRef } from 'react';
import { SPRITES, VARIANTS, SLOTS, MAX_FLAKES, INTRO_SECONDS, LEVEL_LIGHT } from './pixelSnowSprites';
import { clamp, seeded, sizeTarget, createColorResolver } from './pixelSnowGl';
import { populateFlakes, simulateFlakes, settlePile } from './pixelSnowSimulation';
import { renderSnowAndPile, renderBloomPyramid, renderCompositeOutput } from './pixelSnowPasses';
import { initPixelSnowGl, destroyPixelSnowGl } from './pixelSnowResources';

export function usePixelSnowRenderer(containerRef, canvasRef, settingsRef) {
  const wakeRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const gl = canvas.getContext('webgl2', { alpha: true, depth: false, antialias: false, preserveDrawingBuffer: false });
    if (!gl) return;

    const res = initPixelSnowGl(gl);
    if (!res) return;
    const pileRef = { pile: new Float32Array(0), pileWidth: 0 };
    const toRgb = createColorResolver();
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const rng = seeded(4271);
    const flakes = [];
    const view = { width: 1, height: 1, ratio: 1, pixel: 1, gridWidth: 1, gridHeight: 1 };
    const pointer = { x: 0, y: 0, vx: 0, vy: 0, inside: false, time: 0 };
    const state = { time: 0, intro: settingsRef.current.intro && !reduce ? 0 : 1, push: 0 };
    const instances = new Float32Array(MAX_FLAKES * 4);
    let raf = 0;
    let last = 0;
    let visible = true;

    const render = () => {
      const s = settingsRef.current;
      sizeTarget(gl, res.snow, view.gridWidth, view.gridHeight);
      let count = 0;
      const sizes = SPRITES[VARIANTS[s.variant]].map((rows) => rows.length);
      const sweep = state.intro * 1.75;
      for (const flake of flakes) {
        const level = flake.level;
        const depthLight = 1 - s.depth * (1 - LEVEL_LIGHT[level]);
        const spark = Math.pow(Math.max(0, Math.sin(state.time * 0.9 + flake.sparkle)), 60) * s.twinkle;
        const reveal = flake.reveal < 0 || state.intro >= 1 ? 1 : clamp((sweep - flake.y / view.height - flake.reveal * 0.25) / 0.35, 0, 1);
        if (reveal <= 0) continue;
        const slot = level >= 2 && flake.alt ? level + 3 : level;
        const o = count * 4;
        instances[o] = flake.x / view.pixel;
        instances[o + 1] = flake.y / view.pixel;
        instances[o + 2] = s.variant * SLOTS + slot;
        instances[o + 3] = Math.min(1, depthLight * (0.85 + spark * 0.6)) * reveal * reveal;
        count++;
      }
      renderSnowAndPile(gl, res.programs, res.snow, res.pileTexture, pileRef, res.quadVao, res.flakeVao, res.instanceBuffer, instances, count, sizes, res.atlasTexture, state, s);
      renderBloomPyramid(gl, res.programs, res.down, res.up, res.snow, res.quadVao);
      renderCompositeOutput(gl, res.programs.composite, res.snow, res.up, canvas, view, s, toRgb);
    };

    const frame = (now) => {
      raf = 0;
      if (!visible || (typeof document !== 'undefined' && document.hidden)) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const moving = !s.paused && !reduce;
      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
      const goal = s.mouseInteraction && pointer.inside && !reduce ? 1 : 0;
      state.push += (goal - state.push) * (1 - Math.exp(-dt * (goal ? 6 : 3)));
      pointer.vx *= Math.exp(-dt * 6);
      pointer.vy *= Math.exp(-dt * 6);
      populateFlakes(flakes, s, view, rng);
      if (moving) {
        state.time += dt;
        simulateFlakes(flakes, s, dt, state, pointer, view, pileRef.pile, rng);
        settlePile(pileRef.pile, s, dt, view);
      }
      render();
      if (moving || Math.abs(goal - state.push) > 0.001) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && visible && !(typeof document !== 'undefined' && document.hidden)) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const ratio = Math.min(s.dpr || (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1, 2);
      view.width = width;
      view.height = height;
      view.ratio = ratio;
      view.pixel = Math.max(1, Math.round(s.pixelSize * ratio)) / ratio;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      view.gridWidth = Math.max(1, Math.ceil(width / view.pixel));
      view.gridHeight = Math.max(1, Math.ceil(height / view.pixel));
      if (pileRef.pile.length !== view.gridWidth) pileRef.pile = new Float32Array(view.gridWidth);
      populateFlakes(flakes, s, view, rng);
      render();
      wake();
    };

    const onPointerMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const now = performance.now();
      if (pointer.inside && pointer.time) {
        const elapsed = Math.max(1, now - pointer.time) / 1000;
        pointer.vx = clamp((x - pointer.x) / elapsed, -3000, 3000);
        pointer.vy = clamp((y - pointer.y) / elapsed, -3000, 3000);
      }
      pointer.x = x;
      pointer.y = y;
      pointer.time = now;
      pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      wake();
    };

    const onPointerLeave = () => { pointer.inside = false; wake(); };
    const onVisibility = () => { last = 0; wake(); };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) { last = 0; wake(); }
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    let lastPixel = settingsRef.current.pixelSize;
    let lastDpr = settingsRef.current.dpr;
    wakeRef.current = () => {
      const s = settingsRef.current;
      if (s.pixelSize !== lastPixel || s.dpr !== lastDpr) {
        lastPixel = s.pixelSize;
        lastDpr = s.dpr;
        resize();
        return;
      }
      populateFlakes(flakes, s, view, rng);
      if (!raf) render();
      wake();
    };

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      destroyPixelSnowGl(gl, res);
    };
  }, []);

  return wakeRef;
}
