import { useEffect, useState } from 'react';
import { rstMenuApi } from '../../api/menu.api';
import { isDirectMenuImageUrl, parseMenuImageItemId } from '../utils/menuImageRef';

/**
 * Resolves POS menu imageUrl: http(s)/data URI as-is, or aurent-menu-img:{id} via auth fetch.
 */
export function useRstMenuImageSrc(imageUrl) {
  const [src, setSrc] = useState(() => (isDirectMenuImageUrl(imageUrl) ? imageUrl : ''));

  useEffect(() => {
    if (isDirectMenuImageUrl(imageUrl)) {
      setSrc(imageUrl);
      return undefined;
    }
    const itemId = parseMenuImageItemId(imageUrl);
    if (!itemId) {
      setSrc('');
      return undefined;
    }
    let cancelled = false;
    let objectUrl = '';
    setSrc('');
    rstMenuApi.getImageBlob(itemId)
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc('');
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageUrl]);

  return src;
}
