export default function CustomerDisplayThanks({ t }) {
  return (
    <div className="rst-cfd__center">
      <div className="rst-cfd__mark rst-cfd__mark--ok" aria-hidden>✓</div>
      <h2 className="rst-cfd__title">{t('rst.cfd.thanks')}</h2>
      <p className="rst-cfd__hint">{t('rst.cfd.thanksHint')}</p>
    </div>
  );
}
