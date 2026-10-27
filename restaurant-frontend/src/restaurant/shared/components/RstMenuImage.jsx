import { useRstMenuImageSrc } from '../hooks/useRstMenuImageSrc';

/** Authenticated menu photo for POS thumbs (supports aurent-menu-img refs). */
export default function RstMenuImage({ imageUrl, alt = '', className }) {
  const src = useRstMenuImageSrc(imageUrl);
  if (!src) return null;
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />;
}
