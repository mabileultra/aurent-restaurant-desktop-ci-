import { PHARMACY_INTEGRATION_ICONS } from '../constants/pharmacyIntegrationIcons';
import '../styles/pharmacy-integration-icon.css';

export default function PharmacyIntegrationIcon({ linkId, className = '' }) {
  const src = PHARMACY_INTEGRATION_ICONS[linkId];
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      className={`pharmacy-integration-icon pharmacy-integration-icon--${linkId} ${className}`.trim()}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
