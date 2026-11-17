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
import { useId } from 'react';
import { SIZES, VARIANTS, TILE_PATH, LETTER_PATH, cx } from './spinnerStyles';
import { useSpinnerStyles, useDelayedMount, useCenterInView } from './spinnerHooks';

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

export { useSpinnerDelay } from './spinnerHooks';
