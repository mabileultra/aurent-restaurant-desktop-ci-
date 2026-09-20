import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { BRAND_LOGO_FULL, BRAND_NAME } from '../../config/brandLogos';

/**
 * Логотип: кастомный из настроек компании или фирменный Aurent (logo2).
 * @param {'icon'|'full'} variant — icon: квадратная рамка; full: по высоте
 */
export default function BrandMark({
  variant = 'full',
  size = 32,
  height,
  className = '',
  alt,
}) {
  const tenantLogo = useTenantDisplayStore((s) => s.committed.systemLogoDataUrl);
  const systemLogoSizePx = useTenantDisplayStore((s) => s.committed.systemLogoSizePx);
  const label = alt ?? BRAND_NAME;
  const src = BRAND_LOGO_FULL;

  if (tenantLogo) {
    const px = systemLogoSizePx || (typeof size === 'number' ? size : 32);
    return (
      <img
        src={tenantLogo}
        alt={label}
        className={`brand-logo object-contain ${className}`.trim()}
        style={{ width: px, height: px, maxWidth: px, maxHeight: px }}
      />
    );
  }

  if (variant === 'icon') {
    const px = typeof size === 'number' ? size : 32;
    return (
      <img
        src={src}
        alt={label}
        className={`brand-logo brand-logo--icon ${className}`.trim()}
        style={{ width: px, height: px }}
      />
    );
  }

  const h = height ?? 40;
  return (
    <img
      src={src}
      alt={label}
      className={`brand-logo brand-logo--full ${className}`.trim()}
      style={{ height: h }}
    />
  );
}
