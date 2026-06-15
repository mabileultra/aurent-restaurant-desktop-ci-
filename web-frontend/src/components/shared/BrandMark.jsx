import { DEFAULT_BRAND_LOGO_SRC } from '../../config/brand';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';

/**
 * Логотип системы: загруженный в настройках или знак DT Group по умолчанию.
 */
export default function BrandMark({ size = 32, className = '' }) {
  const logo = useTenantDisplayStore((s) => s.committed.systemLogoDataUrl);
  const systemLogoSizePx = useTenantDisplayStore((s) => s.committed.systemLogoSizePx);
  const base = typeof size === 'number' ? size : 32;
  const px = logo && systemLogoSizePx ? systemLogoSizePx : base;
  const src = logo || DEFAULT_BRAND_LOGO_SRC;

  return (
    <img
      src={src}
      alt=""
      className={`object-contain ${className}`.trim()}
      style={{ width: px, height: px, maxWidth: px, maxHeight: px }}
    />
  );
}
