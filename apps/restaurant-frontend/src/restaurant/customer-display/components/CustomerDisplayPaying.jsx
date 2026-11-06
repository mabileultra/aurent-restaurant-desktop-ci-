export default function CustomerDisplayPaying({ t }) {
  return (
    <div className="rst-cfd__center">
      <div className="rst-cfd__mark rst-cfd__mark--pay" aria-hidden>
        <span className="rst-cfd__spinner" />
      </div>
      <h2 className="rst-cfd__title">{t('rst.cfd.paying')}</h2>
      <p className="rst-cfd__hint">{t('rst.cfd.payingHint')}</p>
    </div>
  );
}
