import { RUBBER } from './rubberSegmentConstants';

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const rubber = (over, dim) => (over * dim * RUBBER) / (dim + RUBBER * Math.abs(over));

export const project = (v, glide) => {
  const d = 1 - 0.1 * Math.pow(0.05, glide / 100);
  return ((v / 1000) * d) / (1 - d);
};

export const velocityOf = (hist, now) => {
  const recent = hist.filter(([t]) => now - t <= 100);
  if (recent.length < 2) return 0;
  const [t0, x0] = recent[0];
  const [t1, x1] = recent[recent.length - 1];
  return t1 - t0 >= 8 ? ((x1 - x0) / (t1 - t0)) * 1000 : 0;
};

export const nearestSlot = (slots, x) => {
  let best = 0;
  for (let i = 1; i < slots.length; i += 1) {
    const prevDist = Math.abs((slots[best].l + slots[best].r) / 2 - x);
    const currDist = Math.abs((slots[i].l + slots[i].r) / 2 - x);
    if (currDist < prevDist) best = i;
  }
  return best;
};
