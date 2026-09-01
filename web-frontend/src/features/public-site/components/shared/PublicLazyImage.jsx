import { useState } from 'react';
import { publicImageFallback } from '../../constants/publicSiteMedia';

export default function PublicLazyImage({
  src,
  srcSet,
  alt,
  className,
  loading = 'lazy',
  sizes = '(max-width: 640px) 100vw, 50vw',
}) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = failed ? publicImageFallback() : src;
  const resolvedSrcSet = failed ? undefined : srcSet;

  return (
    <img
      className={className}
      src={resolvedSrc}
      srcSet={resolvedSrcSet}
      sizes={resolvedSrcSet ? sizes : undefined}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
