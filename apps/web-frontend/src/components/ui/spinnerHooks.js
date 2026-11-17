import { useLayoutEffect, useEffect, useInsertionEffect, useState, useRef } from 'react';
import { STYLE_ID, CSS } from './spinnerStyles';

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Injects the CSS once (and refreshes it on HMR). */
export function useSpinnerStyles() {
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
export function useDelayedMount(delay) {
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
export function useCenterInView(enabled) {
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
