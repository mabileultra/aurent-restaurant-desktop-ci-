import { useRstMenuImageSrc } from '../hooks/useRstMenuImageSrc';
import '../styles/menu-image.css';

/** Menu photo. During a shift the file is already in memory after the quiet preload. */
export default function RstMenuImage({ imageUrl, alt = '', className }) {
  const src = useRstMenuImageSrc(imageUrl);
  return (
    <span className="rst-menu-image">
      {src ? (
        <img src={src} alt={alt} className={className} decoding="async" />
      ) : null}
    </span>
  );
}
