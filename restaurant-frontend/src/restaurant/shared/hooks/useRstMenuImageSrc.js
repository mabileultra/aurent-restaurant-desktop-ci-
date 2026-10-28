import { useEffect, useState } from 'react';
import { isDirectMenuImageUrl, parseMenuImageItemId } from '../utils/menuImageRef';
import { loadMenuImageBlob } from '../utils/menuImageLoadQueue';
import {
  menuImageShiftMode,
  peekMenuImageSrc,
  subscribeMenuImages,
} from '../utils/menuImageShiftCache';

/**
 * Shift-open photos come from the shift cache (kept until the shift ends).
 * With no shift session, a card loads its own url and drops it on unmount.
 * A closed shift does not load.
 */
export function useRstMenuImageSrc(imageUrl) {
  const direct = isDirectMenuImageUrl(imageUrl) ? imageUrl : '';
  const itemId = direct ? '' : (parseMenuImageItemId(imageUrl) || '');
  const [src, setSrc] = useState(() => direct || (itemId ? peekMenuImageSrc(itemId) : ''));

  useEffect(() => {
    if (direct) {
      setSrc(direct);
      return undefined;
    }
    if (!itemId) {
      setSrc('');
      return undefined;
    }
    let cancelled = false;
    let ownedUrl = '';
    const apply = (next) => {
      if (!cancelled) setSrc(next || '');
    };
    const cached = peekMenuImageSrc(itemId);
    if (cached) {
      apply(cached);
    } else if (menuImageShiftMode() === 'closed') {
      apply('');
    } else {
      loadMenuImageBlob(itemId)
        .then((result) => {
          if (cancelled || !result?.src) return;
          if (result.owned) ownedUrl = result.src;
          apply(result.src);
        })
        .catch(() => apply(''));
    }
    const unsubscribe = subscribeMenuImages(() => {
      const next = peekMenuImageSrc(itemId);
      if (next) {
        apply(next);
        return;
      }
      if (!ownedUrl) apply('');
    });
    return () => {
      cancelled = true;
      unsubscribe();
      if (ownedUrl) URL.revokeObjectURL(ownedUrl);
    };
  }, [direct, itemId]);

  return src;
}
