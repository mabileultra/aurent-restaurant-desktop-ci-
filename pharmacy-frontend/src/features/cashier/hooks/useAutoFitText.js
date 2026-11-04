import { useLayoutEffect, useRef } from 'react';

const DEFAULT_ROOT_PX = 16;

function remToPx(rem, rootPx = DEFAULT_ROOT_PX) {
  return Math.round(rem * rootPx);
}

export function useAutoFitText(text, { minRem = 0.8125, maxRem = 2.5, stepPx = 1 } = {}) {
  const containerRef = useRef(null);
  const textRef = useRef(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const el = textRef.current;
    if (!container || !el) return undefined;

    const fit = () => {
      const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || DEFAULT_ROOT_PX;
      const minPx = remToPx(minRem, rootPx);
      const maxPx = remToPx(maxRem, rootPx);
      let size = maxPx;

      el.style.fontSize = `${size}px`;
      while (size > minPx && el.scrollWidth > container.clientWidth) {
        size -= stepPx;
        el.style.fontSize = `${size}px`;
      }
    };

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(container);

    return () => observer.disconnect();
  }, [text, minRem, maxRem, stepPx]);

  return { containerRef, textRef };
}
