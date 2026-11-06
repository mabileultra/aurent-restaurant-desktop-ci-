import { useEffect, useRef, useState } from 'react';

export const DEFAULT_SPINNER_DELAY_MS = 250;
export const DEFAULT_MIN_SPINNER_DURATION_MS = 400;

/**
 * Calculates remaining milliseconds the spinner must stay visible to satisfy minDuration.
 * Pure calculation function.
 *
 * @param {number|null} shownAt - Timestamp when spinner became visible.
 * @param {number} [now=Date.now()] - Current timestamp.
 * @param {number} [minDuration=400] - Minimum duration spinner must be displayed.
 * @returns {number} Remaining milliseconds (0 if duration satisfied or not shown).
 */
export function calculateRemainingDisplayTime(
  shownAt,
  now = Date.now(),
  minDuration = DEFAULT_MIN_SPINNER_DURATION_MS
) {
  if (!shownAt) return 0;
  const elapsed = Math.max(0, now - shownAt);
  return Math.max(0, minDuration - elapsed);
}

/**
 * Eliminates spinner flicker for fast asynchronous operations (~100-200ms).
 * - Delays showing spinner until `delay` has elapsed.
 * - Once shown, holds spinner visible for at least `minDuration` to avoid micro-stutter.
 *
 * @param {boolean} isLoading
 * @param {object} [options]
 * @param {number} [options.delay=250] - Milliseconds to wait before showing spinner.
 * @param {number} [options.minDuration=400] - Minimum milliseconds spinner remains visible.
 * @returns {boolean} Whether the spinner should be displayed.
 */
export function useDelayedLoading(
  isLoading,
  { delay = DEFAULT_SPINNER_DELAY_MS, minDuration = DEFAULT_MIN_SPINNER_DURATION_MS } = {}
) {
  const [show, setShow] = useState(false);
  const shownAtRef = useRef(null);
  const delayTimerRef = useRef(null);
  const minDurationTimerRef = useRef(null);

  useEffect(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }

    if (isLoading) {
      if (shownAtRef.current) {
        if (minDurationTimerRef.current) {
          clearTimeout(minDurationTimerRef.current);
          minDurationTimerRef.current = null;
        }
        setShow(true);
        return;
      }

      delayTimerRef.current = setTimeout(() => {
        shownAtRef.current = Date.now();
        setShow(true);
      }, delay);
    } else {
      if (!shownAtRef.current) {
        setShow(false);
        return;
      }

      const remainingTime = calculateRemainingDisplayTime(
        shownAtRef.current,
        Date.now(),
        minDuration
      );

      if (remainingTime > 0) {
        minDurationTimerRef.current = setTimeout(() => {
          shownAtRef.current = null;
          setShow(false);
        }, remainingTime);
      } else {
        shownAtRef.current = null;
        setShow(false);
      }
    }

    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (minDurationTimerRef.current) clearTimeout(minDurationTimerRef.current);
    };
  }, [isLoading, delay, minDuration]);

  useEffect(() => {
    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (minDurationTimerRef.current) clearTimeout(minDurationTimerRef.current);
    };
  }, []);

  return show;
}
