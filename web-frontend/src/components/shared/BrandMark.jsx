import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { BRAND_LOGO_FULL, BRAND_LOGO_ICON, BRAND_NAME } from '../../config/brandLogos';

/**
 * Логотип: кастомный из настроек компании или фирменный Aurent.
 * @param {'icon'|'full'} variant — logo1 (иконка) или logo2 (полный, для desktop)
 */
export default function BrandMark({
  variant = 'icon',
  size = 32,
  height,
  className = '',
  alt,
}) {
  const tenantLogo = useTenantDisplayStore((s) => s.committed.systemLogoDataUrl);
  const systemLogoSizePx = useTenantDisplayStore((s) => s.committed.systemLogoSizePx);
  const label = alt ?? BRAND_NAME;

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

  const isFull = variant === 'full';
  const src = isFull ? BRAND_LOGO_FULL : BRAND_LOGO_ICON;

  if (isFull) {
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
