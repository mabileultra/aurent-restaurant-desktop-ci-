/**
 * Optional POS beeps (Web Audio, no asset files).
 * Default off — enable via PosSoundToggle / setPosSoundsEnabled.
 */

const STORAGE_KEY = 'rst-pos-sounds-enabled';

let audioCtx = null;
let unlocked = false;

export function isPosSoundsEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setPosSoundsEnabled(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (on) unlockPosAudio();
}

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

/** Browsers block audio until a user gesture — call from click/toggle. */
export function unlockPosAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  unlocked = true;
}

const PATTERNS = {
  /** New kitchen ticket */
  kitchen: [
    { f: 880, d: 0.09, g: 0.18 },
    { f: 1175, d: 0.12, g: 0.16, gap: 0.05 },
  ],
  /** Payment / success */
  success: [
    { f: 523, d: 0.08, g: 0.14 },
    { f: 784, d: 0.12, g: 0.14, gap: 0.04 },
  ],
  /** Error / block */
  error: [
    { f: 220, d: 0.16, g: 0.2 },
    { f: 185, d: 0.2, g: 0.18, gap: 0.06 },
  ],
};

function beep(ctx, { f, d, g }, when) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = f;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(g, when + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + d);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + d + 0.02);
}

/**
 * @param {'kitchen'|'success'|'error'} kind
 */
export function playPosSound(kind) {
  if (!isPosSoundsEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  if (!unlocked && ctx.state !== 'running') return;

  const steps = PATTERNS[kind] || PATTERNS.success;
  let t = ctx.currentTime + 0.01;
  for (const step of steps) {
    t += step.gap || 0;
    beep(ctx, step, t);
    t += step.d;
  }
}
