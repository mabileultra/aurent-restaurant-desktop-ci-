export default function CustomerDisplayIdle({ t }) {
  return (
    <div className="rst-cfd__center">
      <h2 className="rst-cfd__title">{t('rst.cfd.welcome')}</h2>
      <p className="rst-cfd__hint">{t('rst.cfd.welcomeHint')}</p>
    </div>
  );
}
