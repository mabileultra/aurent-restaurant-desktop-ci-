import { LEVELS, LEVEL_WEIGHTS, LEVEL_FALL, MAX_FLAKES } from './pixelSnowSprites';
import { clamp } from './pixelSnowGl';

export const pickLevel = (r, s) => {
  const shift = s.flakeSize - 1;
  let total = 0;
  const weights = LEVEL_WEIGHTS.map((weight, level) => weight * Math.pow(2.2, shift * (level - 1.5)));
  const sum = weights.reduce((a, b) => a + b, 0);
  for (let level = 0; level < LEVELS; level++) {
    total += weights[level] / sum;
    if (r <= total) return level;
  }
  return LEVELS - 1;
};

export const spawnFlake = (flake, s, top, rng, view) => {
  flake.level = pickLevel(rng(), s);
  flake.x = rng() * (view.width + 40) - 20;
  flake.y = top ? -10 - rng() * 30 : rng() * view.height;
  flake.vx = 0;
  flake.vy = LEVEL_FALL[flake.level];
  flake.phase = rng() * Math.PI * 2;
  flake.rate = 0.6 + rng() * 0.9;
  flake.sparkle = rng() * 100;
  flake.drift = 0.7 + rng() * 0.6;
  flake.alt = rng() < 0.5;
  flake.reveal = rng();
  flake.levelSize = s.flakeSize;
};

export const populateFlakes = (flakes, s, view, rng) => {
  const target = Math.round(clamp((view.width * view.height * s.density) / 1100, 0, MAX_FLAKES));
  while (flakes.length < target) {
    const flake = {};
    spawnFlake(flake, s, false, rng, view);
    flakes.push(flake);
  }
  if (flakes.length > target) flakes.length = target;
};

export const simulateFlakes = (flakes, s, dt, state, pointer, view, pile, rng) => {
  const fall = s.speed;
  const windSpeed = s.wind * 46;
  const radius = 120;
  const pushing = state.push > 0.001 && pointer.inside;
  const margin = 24;
  const settle = s.accumulate && fall > 0 && pile.length > 0;
  for (const flake of flakes) {
    if (flake.levelSize !== s.flakeSize) {
      flake.level = pickLevel(rng(), s);
      flake.levelSize = s.flakeSize;
    }
    const level = flake.level;
    const parallax = 1 - s.depth * (1 - (level + 1) / LEVELS) * 0.75;
    const swing = Math.sin(state.time * flake.rate + flake.phase) * s.sway * (6 + level * 7);
    const targetX = (windSpeed * parallax + swing) * flake.drift;
    const targetY = LEVEL_FALL[level] * parallax * fall * flake.drift;
    const ease = 1 - Math.exp(-dt * 2.2);
    flake.vx += (targetX - flake.vx) * ease;
    flake.vy += (targetY - flake.vy) * ease;
    if (pushing) {
      const dx = flake.x - pointer.x;
      const dy = flake.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance < radius && distance > 0.001) {
        const near = 1 - distance / radius;
        const repel = near * near * near * state.push * 1500 * dt;
        const carry = near * near * state.push * dt * 5;
        flake.vx += (dx / distance) * repel + pointer.vx * carry;
        flake.vy += (dy / distance) * repel + pointer.vy * carry;
      }
    }
    flake.x += flake.vx * dt;
    flake.y += flake.vy * dt;
    if (settle) {
      const column = Math.floor(flake.x / view.pixel);
      if (column >= 0 && column < pile.length) {
        const surface = view.height - pile[column] * view.pixel;
        if (flake.y >= surface && pile[column] > 0.5) {
          const reach = level;
          for (let k = -reach; k <= reach; k++) {
            const index = column + k;
            if (index >= 0 && index < pile.length) {
              pile[index] += (0.35 + level * 0.15) * (1 - Math.abs(k) / (reach + 1));
            }
          }
          spawnFlake(flake, s, true, rng, view);
          flake.reveal = -1;
          continue;
        }
      }
    }
    if (fall >= 0 ? flake.y > view.height + margin : flake.y < -margin) {
      spawnFlake(flake, s, true, rng, view);
      flake.reveal = -1;
      if (fall < 0) flake.y = view.height + 10 + rng() * 30;
    }
    if (flake.x < -margin) flake.x += view.width + margin * 2;
    else if (flake.x > view.width + margin) flake.x -= view.width + margin * 2;
  }
};

export const settlePile = (pile, s, dt, view) => {
  if (!pile.length) return;
  const cap = Math.max(4, view.gridHeight * 0.08);
  if (s.accumulate && s.speed > 0) {
    const grow = (0.25 + s.density * 0.9) * dt * Math.min(1, s.speed);
    for (let i = 0; i < pile.length; i++) {
      const dune = 0.55 + 0.45 * Math.sin(i * 0.045 + Math.sin(i * 0.013) * 2.1) * Math.sin(i * 0.021 + 1.3);
      if (pile[i] < cap * dune) pile[i] += grow * (0.6 + 0.8 * dune);
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    const forward = pass === 0;
    for (let k = 0; k < pile.length - 1; k++) {
      const i = forward ? k : pile.length - 2 - k;
      const difference = pile[i] - pile[i + 1];
      if (Math.abs(difference) > 1.2) {
        const move = (Math.abs(difference) - 1.2) * 0.5 * Math.sign(difference);
        pile[i] -= move;
        pile[i + 1] += move;
      }
    }
  }
  for (let i = 0; i < pile.length; i++) {
    const excess = Math.max(0, pile[i] - cap);
    const rate = s.accumulate && s.speed > 0 ? excess * 0.8 : 2 + pile[i] * 0.6;
    pile[i] = Math.max(0, pile[i] - rate * dt);
  }
};
