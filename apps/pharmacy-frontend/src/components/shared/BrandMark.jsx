import React from 'react';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { BRAND_LOGO_FULL, BRAND_LOGO_ICON, BRAND_NAME } from '../../config/brandLogos';

/**
 * Логотип: кастомный из настроек компании или фирменный Aurent (logo2).
 * @param {'icon'|'full'} variant — icon: квадратная рамка; full: по высоте
 */
export default function BrandMark({
  variant = 'full',
  size,
  height,
  className = '',
  alt,
  style = {},
}) {
  const tenantLogo = useTenantDisplayStore((s) => s.committed.systemLogoDataUrl);
  const systemLogoSizePx = useTenantDisplayStore((s) => s.committed.systemLogoSizePx);
  const label = alt ?? BRAND_NAME;
  const src = variant === 'icon' ? BRAND_LOGO_ICON : BRAND_LOGO_FULL;
  const iconPx = typeof size === 'number' ? size : 32;

  if (tenantLogo) {
    const px = systemLogoSizePx || iconPx;
    if (variant === 'full') {
      const h = height ?? (typeof size === 'number' ? size : px);
      return (
        <img
          src={tenantLogo}
          alt={label}
          className={`brand-logo brand-logo--full object-contain ${className}`.trim()}
          style={{ height: h, width: 'auto', maxWidth: '220px', objectFit: 'contain', ...style }}
        />
      );
    }
    return (
      <img
        src={tenantLogo}
        alt={label}
        className={`brand-logo brand-logo--icon object-contain ${className}`.trim()}
        style={{ width: px, height: px, maxWidth: px, maxHeight: px, objectFit: 'contain', ...style }}
      />
    );
  }

  if (variant === 'icon') {
    return (
      <img
        src={src}
        alt={label}
        className={`brand-logo brand-logo--icon object-contain ${className}`.trim()}
        style={{ width: iconPx, height: iconPx, objectFit: 'contain', ...style }}
      />
    );
  }

  const h = height ?? (typeof size === 'number' ? size : 40);
  return (
    <img
      src={src}
      alt={label}
      className={`brand-logo brand-logo--full object-contain ${className}`.trim()}
      style={{ height: h, width: 'auto', objectFit: 'contain', ...style }}
    />
  );
}
