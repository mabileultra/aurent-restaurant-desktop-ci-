/**
 * Operator hint on the guest screen — fades after a few seconds.
 */
export default function CustomerDisplayKeysHint({ t, visible }) {
  if (!visible) return null;
  return (
    <aside className="rst-cfd__keys" aria-label={t('rst.cfd.keysLabel')}>
      <span><kbd>F11</kbd> {t('rst.cfd.keyFullscreen')}</span>
      <span><kbd>Esc</kbd> {t('rst.cfd.keyExitFullscreen')}</span>
    </aside>
  );
}
