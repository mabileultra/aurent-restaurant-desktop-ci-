export function openPharmacyExternalUrl(url) {
  if (!url) return;
  const absolute = url.startsWith('http') ? url : new URL(url, window.location.origin).href;
  window.open(absolute, '_blank', 'noopener,noreferrer');
}
