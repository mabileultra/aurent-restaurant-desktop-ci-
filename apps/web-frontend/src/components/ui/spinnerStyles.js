import { useEffect, useInsertionEffect } from 'react';

export const STYLE_ID = 'aurent-spinner-c';

export const SIZES = {
  xs: { px: 14, ring: 2 },
  sm: { px: 18, ring: 2.25 },
  md: { px: 28, ring: 2.75, tile: 4.2, letter: 2.6 },
  lg: { px: 44, ring: 3, tile: 3.6, letter: 2.1 },
  xl: { px: 64, ring: 3.5, tile: 3.2, letter: 1.8 },
  '2xl': { px: 88, ring: 4, tile: 3, letter: 1.6 },
};

export const VARIANTS = ['emerald', 'white', 'slate', 'amber', 'current'];

export const TILE_PATH =
  'M18 2H46A16 16 0 0 1 62 18V46A16 16 0 0 1 46 62H18A16 16 0 0 1 2 46V18A16 16 0 0 1 18 2Z';
export const LETTER_PATH =
  'M18 48L28.5 16h7L46 48h-7.2l-1.8-6.2H27l-1.8 6.2H18zm10.4-12.2h7.2L32 24.5l-3.6 11.3z';

const FONT = 'Inter, "Segoe UI", system-ui, sans-serif';
const CYCLE = '2.8s';

export const CSS = `
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
.aur-sp-overlay__slot{position:absolute;top:0;left:0;right:0;display:flex;justify-content:center;
  transform:translateY(16px);transition:transform .14s ease-out;will-change:transform}
.aur-sp-overlay__pill{display:inline-flex;align-items:center;padding:8px 16px 8px 10px;
  border-radius:9999px;background:#fff;border:1px solid #e2e8f0;
  box-shadow:0 10px 25px -5px rgba(15,23,42,.12),0 8px 10px -6px rgba(15,23,42,.08);
  font-weight:600;color:#0f172a}
.dark .aur-sp-overlay{background:rgba(15,23,42,.55)}
.dark .aur-sp-overlay__pill{background:#0f172a;border-color:#334155;color:#f8fafc;
  box-shadow:0 10px 25px -5px rgba(0,0,0,.45)}

/* fullScreen boot / blocking screen */
.aur-sp-screen{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;
  background:#fff;animation:aur-sp-in .2s ease-out both}
.dark .aur-sp-screen,.aur-sp-screen--dark{background:#022c22;color:#fff}

@keyframes aur-sp-fade-loop{0%,100%{opacity:.15}18%,75%{opacity:1}88%{opacity:.25}}
@keyframes aur-sp-tile{0%{stroke-dashoffset:100;fill-opacity:0}28%{stroke-dashoffset:0;fill-opacity:0}38%,80%{stroke-dashoffset:0;fill-opacity:1}95%,100%{stroke-dashoffset:0;fill-opacity:0}}
@keyframes aur-sp-letter{0%,20%{stroke-dashoffset:100;fill-opacity:0}48%{stroke-dashoffset:0;fill-opacity:0}58%,80%{stroke-dashoffset:0;fill-opacity:1}95%,100%{stroke-dashoffset:0;fill-opacity:0}}
@keyframes aur-sp-reg{0%,55%{transform:scale(0);opacity:0}65%,80%{transform:scale(1);opacity:1}92%,100%{transform:scale(0);opacity:0}}
@keyframes aur-sp-glow{0%,22%{opacity:0}40%,75%{opacity:1}92%,100%{opacity:0}}
@keyframes aur-sp-rotate{to{transform:rotate(360deg)}}
@keyframes aur-sp-dash{0%{stroke-dasharray:1 100;stroke-dashoffset:0}50%{stroke-dasharray:75 100;stroke-dashoffset:-20}100%{stroke-dasharray:75 100;stroke-dashoffset:-90}}
@keyframes aur-sp-in{from{opacity:0}to{opacity:1}}
`;

const useInsertEffect = typeof window !== 'undefined' ? useInsertionEffect || useEffect : () => {};

export function useSpinnerStyles() {
  useInsertEffect(() => {
    if (typeof document === 'undefined') return;
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    if (el.textContent !== CSS) el.textContent = CSS;
  }, []);
}

export function cx(...args) {
  return args.filter(Boolean).join(' ');
}
