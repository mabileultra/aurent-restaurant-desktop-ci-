import React, { useEffect, useLayoutEffect, useRef } from 'react';
import '../styles/chroma-grid.css';

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

function calculateFalloffStops(softness) {
  const core = clamp(1 - softness, 0, 0.95);
  const stops = [];
  for (let i = 0; i <= 12; i += 1) {
    const t = i / 12;
    const u = clamp((t - core) / Math.max(0.0001, 1 - core), 0, 1);
    const alpha = 1 - u * u * u * (u * (u * 6 - 15) + 10);
    stops.push(`rgba(0, 0, 0, ${alpha.toFixed(3)}) ${(t * 100).toFixed(1)}%`);
  }
  return stops.join(', ');
}

export default function ChromaGridContainer({
  children,
  className = '',
  radius = 280,
  softness = 0.6,
  damping = 0.45,
  fadeOut = 0.6,
  glow = 0.5,
  borderGlow = 1,
}) {
  const rootRef = useRef(null);
  const settingsRef = useRef({ damping, fadeOut });
  const placeRef = useRef(null);

  settingsRef.current = { damping, fadeOut };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = { x: 0, y: 0, tx: 0, ty: 0, power: 0, target: 0, primed: false };
    let rafId = 0;
    let lastTime = 0;

    const place = () => {
      const box = root.getBoundingClientRect();
      root.querySelectorAll('[data-chroma-area]').forEach((node) => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty('--chroma-ox', `${rect.left - box.left}px`);
        node.style.setProperty('--chroma-oy', `${rect.top - box.top}px`);
      });
    };
    placeRef.current = place;

    const frame = (now) => {
      rafId = 0;
      const s = settingsRef.current;
      if (!s) return;

      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
      lastTime = now;

      const follow = prefersReducedMotion ? 1 : 1 - Math.exp(-dt / Math.max(0.01, s.damping * 0.32));
      state.x += (state.tx - state.x) * follow;
      state.y += (state.ty - state.y) * follow;

      const span = state.target > state.power ? 0.1 : Math.max(0.02, s.fadeOut * 0.35);
      state.power += (state.target - state.power) * (prefersReducedMotion ? 1 : 1 - Math.exp(-dt / span));

      root.style.setProperty('--chroma-x', `${state.x.toFixed(2)}px`);
      root.style.setProperty('--chroma-y', `${state.y.toFixed(2)}px`);
      root.style.setProperty('--chroma-power', state.power.toFixed(4));

      const isSettled =
        Math.abs(state.tx - state.x) < 0.1 &&
        Math.abs(state.ty - state.y) < 0.1 &&
        Math.abs(state.target - state.power) < 0.002;

      if (isSettled) {
        state.power = state.target;
        root.style.setProperty('--chroma-power', state.power.toFixed(4));
        lastTime = 0;
      } else {
        rafId = requestAnimationFrame(frame);
      }
    };

    const wake = () => {
      if (!rafId) rafId = requestAnimationFrame(frame);
    };

    const onMove = (event) => {
      const box = root.getBoundingClientRect();
      state.tx = event.clientX - box.left;
      state.ty = event.clientY - box.top;
      if (!state.primed || state.power < 0.02) {
        state.x = state.tx;
        state.y = state.ty;
        state.primed = true;
      }
      state.target = 1;
      wake();
    };

    const onLeave = () => {
      state.target = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(place);
    resizeObserver.observe(root);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointercancel', onLeave);
    place();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerdown', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointercancel', onLeave);
      placeRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    placeRef.current?.();
  });

  const rootStyle = {
    '--chroma-r': `${Math.max(20, radius)}px`,
    '--chroma-stops': calculateFalloffStops(clamp(softness, 0, 1)),
    '--chroma-glow': clamp(glow, 0, 1),
    '--chroma-border': clamp(borderGlow, 0, 1),
  };

  return (
    <div
      ref={rootRef}
      className={`chroma-grid ${className}`}
      style={rootStyle}
    >
      {children}
    </div>
  );
}
