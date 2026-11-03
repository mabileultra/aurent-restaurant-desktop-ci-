import { useEffect, useRef, useState } from 'react';
import { playPosSound } from '../../pos/utils/posSounds';

const FRESH_MS = 12_000;

function markFresh(setFresh, keys) {
  if (!keys.length) return undefined;
  setFresh((prev) => {
    const next = new Set(prev);
    for (const key of keys) next.add(key);
    return next;
  });
  const timer = window.setTimeout(() => {
    setFresh((prev) => {
      const next = new Set(prev);
      for (const key of keys) next.delete(key);
      return next;
    });
  }, FRESH_MS);
  return () => window.clearTimeout(timer);
}

/** Pulse + sound when numbers enter cooking / ready columns. */
export function useReadyDisplayFreshKeys(board, storeId) {
  const seenReadyRef = useRef(null);
  const seenCookingRef = useRef(null);
  const [freshReadyKeys, setFreshReadyKeys] = useState(() => new Set());
  const [freshCookingKeys, setFreshCookingKeys] = useState(() => new Set());

  useEffect(() => {
    const readyKeys = board.ready.map((row) => row.key);
    const cookingKeys = board.cooking.map((row) => row.key);

    if (seenReadyRef.current == null || seenCookingRef.current == null) {
      seenReadyRef.current = new Set(readyKeys);
      seenCookingRef.current = new Set(cookingKeys);
      return undefined;
    }

    const arrivedReady = [];
    for (const key of readyKeys) {
      if (!seenReadyRef.current.has(key)) {
        seenReadyRef.current.add(key);
        arrivedReady.push(key);
      }
    }

    const arrivedCooking = [];
    for (const key of cookingKeys) {
      if (!seenCookingRef.current.has(key)) {
        seenCookingRef.current.add(key);
        arrivedCooking.push(key);
      }
    }

    const active = new Set([...readyKeys, ...cookingKeys]);
    for (const key of [...seenReadyRef.current]) {
      if (!active.has(key)) seenReadyRef.current.delete(key);
    }
    for (const key of [...seenCookingRef.current]) {
      if (!active.has(key)) seenCookingRef.current.delete(key);
    }
    // Left cooking → ready: drop from cooking seen so a later re-cook can pulse again.
    for (const key of arrivedReady) {
      seenCookingRef.current.delete(key);
    }

    const cleanups = [];
    if (arrivedReady.length) {
      playPosSound('ready');
      const clearReady = markFresh(setFreshReadyKeys, arrivedReady);
      if (clearReady) cleanups.push(clearReady);
    }
    if (arrivedCooking.length) {
      const clearCooking = markFresh(setFreshCookingKeys, arrivedCooking);
      if (clearCooking) cleanups.push(clearCooking);
    }

    if (!cleanups.length) return undefined;
    return () => {
      for (const clear of cleanups) clear();
    };
  }, [board]);

  useEffect(() => {
    seenReadyRef.current = null;
    seenCookingRef.current = null;
    setFreshReadyKeys(new Set());
    setFreshCookingKeys(new Set());
  }, [storeId]);

  return { freshReadyKeys, freshCookingKeys };
}
