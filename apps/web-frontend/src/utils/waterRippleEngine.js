/**
 * Water Ripple physics engine for click animations.
 * Pure mathematical functions for simulating expanding concentric water waves.
 */

export function createWaterRippleGroup(x, y, {
  color = '56, 189, 248',
  ringCount = 3,
  maxRadius = 80,
  speed = 1.4,
} = {}) {
  const rings = [];
  for (let i = 0; i < ringCount; i++) {
    rings.push({
      x,
      y,
      radius: 2,
      maxRadius: Math.max(25, maxRadius - i * 16),
      alpha: Math.max(0.1, 0.65 - i * 0.12),
      initialAlpha: Math.max(0.1, 0.65 - i * 0.12),
      speed: Math.max(0.6, speed - i * 0.25),
      delay: i * 6,
      currentDelay: i * 6,
      color,
    });
  }

  const drop = {
    x,
    y,
    radius: 1,
    maxRadius: 6,
    alpha: 0.85,
    speed: 0.8,
    color: '255, 255, 255',
  };

  return { rings, drop, isAlive: true };
}

export function updateWaterRippleGroups(groups = []) {
  return groups.filter((group) => {
    let anyRingAlive = false;

    group.rings.forEach((ring) => {
      if (ring.currentDelay > 0) {
        ring.currentDelay -= 1;
        anyRingAlive = true;
        return;
      }
      ring.radius += ring.speed;
      const progress = Math.min(1, ring.radius / ring.maxRadius);
      ring.alpha = Math.max(0, ring.initialAlpha * (1 - progress));
      if (ring.alpha > 0.01 && ring.radius < ring.maxRadius) {
        anyRingAlive = true;
      }
    });

    if (group.drop && group.drop.alpha > 0.01) {
      group.drop.radius += group.drop.speed;
      group.drop.alpha -= 0.045;
      if (group.drop.alpha > 0.01) {
        anyRingAlive = true;
      }
    }

    group.isAlive = anyRingAlive;
    return anyRingAlive;
  });
}

export function renderWaterRippleGroups(ctx, groups = []) {
  if (!ctx) return;

  groups.forEach((group) => {
    group.rings.forEach((ring) => {
      if (ring.currentDelay > 0 || ring.alpha <= 0.01) return;

      ctx.save();
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, Math.max(0.1, ring.radius), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${ring.color}, ${ring.alpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(0.75, 2.5 * (1 - ring.radius / ring.maxRadius));
      ctx.shadowColor = `rgba(${ring.color}, 0.45)`;
      ctx.shadowBlur = 4;
      ctx.stroke();
      ctx.restore();
    });

    if (group.drop && group.drop.alpha > 0.01) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(group.drop.x, group.drop.y, Math.max(0.1, group.drop.radius), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${group.drop.color}, ${group.drop.alpha.toFixed(3)})`;
      ctx.fill();
      ctx.restore();
    }
  });
}
