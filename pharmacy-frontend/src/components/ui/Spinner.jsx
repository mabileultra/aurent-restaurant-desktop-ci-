/**
 * Aurent Spinner — "Logo chizilishi" (C)
 *
 * The Aurent tile outline is drawn, then the "A", the tile fills,
 * and the small register mark pops in. The loop then fades and restarts.
 * xs / sm sizes and variant="current" use a compact ring, because
 * the drawing is not readable below 28 px.
 *
 * Drop-in replacement for the previous Spinner: same props
 * (size, variant, className, label, text, showLogo, fullScreen, overlay),
 * plus direction, delay and the useSpinnerDelay() hook.
 * The component injects its own CSS once; no Tailwind classes are required.
 *
 *   <Spinner size="xl" text="Aurent…" />                    // boot screen
 *   <Spinner text="Yuklanmoqda…" />                          // block / table (md)
 *   <Spinner size="sm" variant="current" direction="row" text="Saqlanmoqda…" />  // button
 *   <div className="relative">
 *     <Table rows={rows} />
 *     {refreshing && <Spinner overlay text="Yangilanmoqda…" />}
 *   </div>
 *   <Spinner fullScreen size="2xl" text="Aurent…" />
 *   <Spinner showLogo={false} />                            // force the ring
 */
import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const STYLE_ID = "aurent-spinner-c";

/** px: box size; ring: ring stroke (px); tile/letter: drawing strokes (viewBox units) */
const SIZES = {
  xs: { px: 14, ring: 2 },
  sm: { px: 18, ring: 2.25 },
  md: { px: 28, ring: 2.75, tile: 4.2, letter: 2.6 },
  lg: { px: 44, ring: 3, tile: 3.6, letter: 2.1 },
  xl: { px: 64, ring: 3.5, tile: 3.2, letter: 1.8 },
  "2xl": { px: 88, ring: 4, tile: 3, letter: 1.6 },
};

const VARIANTS = ["emerald", "white", "slate", "amber", "current"];

const TILE_PATH = "M18 2H46A16 16 0 0 1 62 18V46A16 16 0 0 1 46 62H18A16 16 0 0 1 2 46V18A16 16 0 0 1 18 2Z";
const LETTER_PATH = "M18 48L28.5 16h7L46 48h-7.2l-1.8-6.2H27l-1.8 6.2H18zm10.4-12.2h7.2L32 24.5l-3.6 11.3z";

const FONT = 'Inter, "Segoe UI", system-ui, sans-serif';
const CYCLE = "2.8s";

const CSS = `
.aur-sp{
  --aur-tile:#10b981;--aur-line:#047857;--aur-letter:#fff;--aur-reg:#065f46;--aur-glow:rgba(16,185,129,.28);
  --aur-a:#34d399;--aur-b:#047857;--aur-track:rgba(16,185,129,.16);--aur-text:#64748b;
  position:relative;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  color:var(--aur-text);font:500 13px/1.35 ${FONT};vertical-align:middle}
.aur-sp--row{flex-direction:row;gap:8px}
.aur-sp--xs .aur-sp__text,.aur-sp--sm .aur-sp__text{font-size:12px}
.aur-sp--xl .aur-sp__text,.aur-sp--2xl .aur-sp__text{font-size:14px;font-weight:600;letter-spacing:.01em;color:#334155}

.aur-sp--white{--aur-tile:#fff;--aur-line:#047857;--aur-letter:#047857;--aur-reg:#10b981;--aur-glow:rgba(255,255,255,.18);
  --aur-a:#fff;--aur-b:rgba(255,255,255,.72);--aur-track:rgba(255,255,255,.22);--aur-text:rgba(255,255,255,.88)}
.aur-sp--white.aur-sp--xl .aur-sp__text,.aur-sp--white.aur-sp--2xl .aur-sp__text{color:#fff}
.aur-sp--slate{--aur-tile:#475569;--aur-line:#1e293b;--aur-reg:#1e293b;--aur-glow:rgba(100,116,139,.2);
  --aur-a:#94a3b8;--aur-b:#334155;--aur-track:rgba(100,116,139,.18)}
.aur-sp--amber{--aur-tile:#f59e0b;--aur-line:#92400e;--aur-reg:#92400e;--aur-glow:rgba(245,158,11,.26);
  --aur-a:#fbbf24;--aur-b:#b45309;--aur-track:rgba(245,158,11,.18)}
.aur-sp--current{--aur-a:currentColor;--aur-b:currentColor;--aur-track:currentColor;--aur-text:inherit}
.aur-sp--current .aur-sp__track{stroke-opacity:.22}
.dark .aur-sp{--aur-text:#94a3b8}
.dark .aur-sp--emerald{--aur-a:#6ee7b7;--aur-b:#10b981;--aur-track:rgba(52,211,153,.18)}
.dark .aur-sp--xl .aur-sp__text,.dark .aur-sp--2xl .aur-sp__text{color:#e2e8f0}

.aur-sp__graphic{position:relative;display:inline-flex;align-items:center;justify-content:center;flex:none}
.aur-sp__text{white-space:nowrap}
.aur-sp__sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

/* logo drawing */
.aur-sp__draw{position:relative;display:block;overflow:visible;animation:aur-sp-fade-loop ${CYCLE} ease-in-out infinite}
.aur-sp__tile{fill:var(--aur-tile);fill-opacity:0;stroke:var(--aur-tile);stroke-linejoin:round;
  stroke-dasharray:100;stroke-dashoffset:100;animation:aur-sp-tile ${CYCLE} ease-in-out infinite}
.aur-sp__letter{fill:var(--aur-letter);fill-opacity:0;stroke:var(--aur-line);stroke-linejoin:round;
  stroke-dasharray:100;stroke-dashoffset:100;animation:aur-sp-letter ${CYCLE} ease-in-out infinite}
.aur-sp__reg{fill:var(--aur-reg);transform-box:view-box;transform-origin:42px 37px;transform:scale(0);
  animation:aur-sp-reg ${CYCLE} cubic-bezier(.34,1.56,.64,1) infinite}
.aur-sp__glow{position:absolute;inset:-30%;border-radius:9999px;pointer-events:none;opacity:0;
  background:radial-gradient(closest-side,var(--aur-glow),transparent);animation:aur-sp-glow ${CYCLE} ease-in-out infinite}

/* compact ring (xs, sm, current, showLogo=false) */
.aur-sp__ring{display:block;overflow:visible;transform-origin:50% 50%;animation:aur-sp-rotate 1.8s linear infinite}
.aur-sp__track{stroke:var(--aur-track)}
.aur-sp__stop-a{stop-color:var(--aur-a)}
.aur-sp__stop-b{stop-color:var(--aur-b)}
.aur-sp__arc{stroke-dasharray:1 100;stroke-dashoffset:0;animation:aur-sp-dash 1.5s ease-in-out infinite}

/* overlay over existing content */
.aur-sp-overlay{position:absolute;inset:0;z-index:20;border-radius:inherit;background:rgba(248,250,252,.5);
  -webkit-backdrop-filter:blur(.75px);backdrop-filter:blur(.75px);animation:aur-sp-in .18s ease-out both}
/* the slot is moved by JS so the pill stays in the visible part of a tall table */
.aur-sp-overlay__slot{position:absolute;top:0;left:0;right:0;display:flex;justify-content:center;
  transform:translateY(16px);transition:transform .14s ease-out;will-change:transform}
.aur-sp-overlay__pill{display:inline-flex;align-items:center;padding:8px 16px 8px 10px;
  border-radius:9999px;background:#fff;border:1px solid #e2e8f0;
  box-shadow:0 10px 28px -10px rgba(15,23,42,.22),0 2px 6px -2px rgba(15,23,42,.08)}
.aur-sp-overlay__pill .aur-sp{--aur-text:#334155}
.dark .aur-sp-overlay{background:rgba(2,6,23,.55)}
.dark .aur-sp-overlay__pill{background:#0f172a;border-color:#1e293b}
.dark .aur-sp-overlay__pill .aur-sp{--aur-text:#e2e8f0}

/* full screen */
.aur-sp-screen{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(55% 45% at 50% 40%,rgba(16,185,129,.10),transparent 70%),#f8fafc;animation:aur-sp-in .2s ease-out both}
.aur-sp-screen--dark{background:radial-gradient(55% 45% at 50% 40%,rgba(16,185,129,.16),transparent 70%),#0b1220}
.aur-sp-screen--dark .aur-sp{--aur-text:#cbd5e1}
.aur-sp-screen--dark .aur-sp--xl .aur-sp__text,.aur-sp-screen--dark .aur-sp--2xl .aur-sp__text{color:#e2e8f0}

@keyframes aur-sp-tile{0%{stroke-dashoffset:100;fill-opacity:0}32%{stroke-dashoffset:0;fill-opacity:0}46%,100%{stroke-dashoffset:0;fill-opacity:1}}
@keyframes aur-sp-letter{0%,14%{stroke-dashoffset:100;fill-opacity:0;stroke-opacity:1}46%{stroke-dashoffset:0;fill-opacity:0;stroke-opacity:1}58%,100%{stroke-dashoffset:0;fill-opacity:1;stroke-opacity:0}}
@keyframes aur-sp-reg{0%,58%{transform:scale(0)}70%,100%{transform:scale(1)}}
@keyframes aur-sp-fade-loop{0%,84%{opacity:1}96%,100%{opacity:0}}
@keyframes aur-sp-glow{0%,40%{opacity:0}58%,84%{opacity:1}96%,100%{opacity:0}}
@keyframes aur-sp-rotate{to{transform:rotate(360deg)}}
@keyframes aur-sp-dash{0%{stroke-dasharray:1 100;stroke-dashoffset:0}50%{stroke-dasharray:62 100;stroke-dashoffset:-14}100%{stroke-dasharray:62 100;stroke-dashoffset:-99}}
@keyframes aur-sp-in{from{opacity:0}to{opacity:1}}
@keyframes aur-sp-calm{0%,100%{opacity:.55}50%{opacity:1}}

@media (prefers-reduced-motion:reduce){
  .aur-sp__tile,.aur-sp__letter,.aur-sp__reg,.aur-sp__glow{animation:none}
  .aur-sp__tile{stroke-dashoffset:0;fill-opacity:1}
  .aur-sp__letter{stroke-dashoffset:0;fill-opacity:1;stroke-opacity:0}
  .aur-sp__reg{transform:none}
  .aur-sp__draw{animation:aur-sp-calm 2s ease-in-out infinite}
  .aur-sp__ring{animation-duration:3.2s}
  .aur-sp__arc{animation:none;stroke-dasharray:62 100}
  .aur-sp-overlay,.aur-sp-screen{animation:none}
  .aur-sp-overlay__slot{transition:none}
}
`;

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/** Injects the CSS once (and refreshes it on HMR). */
function useSpinnerStyles() {
  useInsertionEffect(() => {
    if (typeof document === "undefined") return;
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    if (el.textContent !== CSS) el.textContent = CSS;
  }, []);
}

/** true after `delay` ms (immediately when delay <= 0). */
function useDelayedMount(delay) {
  const [ready, setReady] = useState(!(delay > 0));
  useEffect(() => {
    if (!(delay > 0)) return undefined;
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return ready;
}

/**
 * Keeps the overlay pill in the visible part of its container.
 * Works inside any scroll area (sticky does not, when a parent has overflow:auto).
 */
function useCenterInView(enabled) {
  const boxRef = useRef(null);
  const itemRef = useRef(null);

  useIsoLayoutEffect(() => {
    const box = boxRef.current;
    const item = itemRef.current;
    if (!enabled || !box || !item) return undefined;

    // ancestors that clip the overlay (scroll areas, overflow hidden)
    const clips = [];
    for (let el = box.parentElement; el && el !== document.body; el = el.parentElement) {
      const s = getComputedStyle(el);
      if (/(auto|scroll|hidden|clip)/.test(`${s.overflowX} ${s.overflowY}`)) clips.push(el);
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const r = box.getBoundingClientRect();
      let top = Math.max(r.top, 0);
      let bottom = Math.min(r.bottom, window.innerHeight || document.documentElement.clientHeight);
      for (const el of clips) {
        const c = el.getBoundingClientRect();
        top = Math.max(top, c.top);
        bottom = Math.min(bottom, c.bottom);
      }
      const h = item.offsetHeight;
      const center = bottom > top ? (top + bottom) / 2 : r.top + r.height / 2;
      const y = Math.max(8, Math.min(center - r.top - h / 2, r.height - h - 8));
      item.style.transform = `translateY(${Math.round(y)}px)`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
    if (ro) ro.observe(box);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      if (ro) ro.disconnect();
    };
  }, [enabled]);

  return [boxRef, itemRef];
}

/**
 * Show a loader only if loading lasts longer than `delay`,
 * and once shown keep it for at least `minDuration` (no 100 ms flashes).
 *
 *   const refreshing = useSpinnerDelay(query.isFetching && !!query.data);
 */
export function useSpinnerDelay(isLoading, { delay = 250, minDuration = 600 } = {}) {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    let timer;
    if (isLoading && !visible) {
      timer = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, delay);
    } else if (!isLoading && visible) {
      const left = Math.max(0, minDuration - (Date.now() - shownAt.current));
      timer = setTimeout(() => setVisible(false), left);
    }
    return () => clearTimeout(timer);
  }, [isLoading, visible, delay, minDuration]);

  return visible;
}

/**
 * Static Aurent logo mark (same API as before: className, withShadow).
 * `inverted` draws a white tile with a green "A" for colored backgrounds.
 */
export function AurentBrandEmblem({ className = "", withShadow = true, inverted = false }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={cx(withShadow && "drop-shadow-sm", className)}
    >
      <rect width="64" height="64" rx="16" fill={inverted ? "#FFFFFF" : "#10B981"} />
      <path fill={inverted ? "#047857" : "#FFFFFF"} d={LETTER_PATH} />
      <rect x="36" y="34" width="12" height="10" rx="1.5" fill={inverted ? "#10B981" : "#065F46"} />
      <rect x="38.5" y="30" width="7" height="5" rx="1" fill={inverted ? "#10B981" : "#065F46"} />
    </svg>
  );
}

function LogoDrawing({ spec, withGlow }) {
  return (
    <span className="aur-sp__graphic" style={{ width: spec.px, height: spec.px }} aria-hidden="true">
      {withGlow && <span className="aur-sp__glow" />}
      <svg className="aur-sp__draw" viewBox="0 0 64 64" width={spec.px} height={spec.px} focusable="false">
        <path className="aur-sp__tile" d={TILE_PATH} pathLength="100" strokeWidth={spec.tile} />
        <path className="aur-sp__letter" d={LETTER_PATH} pathLength="100" strokeWidth={spec.letter} />
        <g className="aur-sp__reg">
          <rect x="36" y="34" width="12" height="10" rx="1.5" />
          <rect x="38.5" y="30" width="7" height="5" rx="1" />
        </g>
      </svg>
    </span>
  );
}

function Ring({ spec, gradientId }) {
  const strokeWidth = (spec.ring * 50) / spec.px; // px -> viewBox units
  const r = 25 - strokeWidth / 2 - 0.25;
  return (
    <span className="aur-sp__graphic" style={{ width: spec.px, height: spec.px }} aria-hidden="true">
      <svg className="aur-sp__ring animate-spin" viewBox="0 0 50 50" width={spec.px} height={spec.px} focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" className="aur-sp__stop-a" />
            <stop offset="100%" className="aur-sp__stop-b" />
          </linearGradient>
        </defs>
        <circle className="aur-sp__track" cx="25" cy="25" r={r} fill="none" strokeWidth={strokeWidth} />
        <circle
          className="aur-sp__arc"
          cx="25"
          cy="25"
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          pathLength="100"
        />
      </svg>
    </span>
  );
}

export function Spinner({
  size = "md",
  variant = "emerald",
  className = "",
  label = "Yuklanmoqda…",
  text = null,
  showLogo,
  direction = "column",
  delay = 0,
  fullScreen = false,
  overlay = false,
}) {
  useSpinnerStyles();
  const ready = useDelayedMount(delay);
  const gradientId = `aur-sp-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [overlayRef, slotRef] = useCenterInView(overlay && ready);

  if (!ready) return null;

  const sizeKey = SIZES[size] ? size : "md";
  const tone = VARIANTS.includes(variant) ? variant : "emerald";

  const render = (key, { caption, row = direction === "row", extraClass, toneOverride } = {}) => {
    const t = toneOverride || tone;
    const spec = SIZES[key];
    const drawLogo = Boolean(spec.tile) && t !== "current" && showLogo !== false;
    return (
      <span
        role="status"
        aria-live="polite"
        className={cx("aur-sp", `aur-sp--${t}`, `aur-sp--${key}`, row && "aur-sp--row", extraClass)}
      >
        {drawLogo ? (
          <LogoDrawing spec={spec} withGlow={key === "xl" || key === "2xl"} />
        ) : (
          <Ring spec={spec} gradientId={gradientId} />
        )}
        {caption ? <span className="aur-sp__text">{caption}</span> : <span className="aur-sp__sr">{label}</span>}
      </span>
    );
  };

  if (overlay) {
    return (
      <div ref={overlayRef} className={cx("aur-sp-overlay", className)}>
        <div ref={slotRef} className="aur-sp-overlay__slot">
          <div className="aur-sp-overlay__pill">
            {render(sizeKey, {
              caption: text || label,
              row: true,
              // the pill is white: a white tile/ring would disappear on it
              toneOverride: tone === "white" ? "emerald" : undefined,
            })}
          </div>
        </div>
      </div>
    );
  }

  if (fullScreen) {
    const screenSize = ["lg", "xl", "2xl"].includes(sizeKey) ? sizeKey : "2xl";
    const dark = tone === "white";
    return (
      <div className={cx("aur-sp-screen", dark && "aur-sp-screen--dark", className)}>
        {render(screenSize, { caption: text, row: false, toneOverride: dark ? "emerald" : undefined })}
      </div>
    );
  }

  return render(sizeKey, { caption: text, extraClass: className });
}

export { Spinner as AurentSpinner };
export default Spinner;
