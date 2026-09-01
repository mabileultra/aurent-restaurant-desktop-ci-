import { PHARMACY_INTEGRATION_ICONS } from '../constants/pharmacyIntegrationIcons';

export default function PharmacyIntegrationIcon({ linkId, className = '' }) {
  const src = PHARMACY_INTEGRATION_ICONS[linkId];
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      className={`pharmacy-integration-icon ${className}`.trim()}
      width={22}
      height={22}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
