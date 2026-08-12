export default function DesktopInstallerFirstRunGuide({ t }) {
  const steps = [
    { title: t('installer.step1Title'), text: t('installer.step1Text') },
    { title: t('installer.step2Title'), text: t('installer.step2Text') },
    { title: t('installer.step3Title'), text: t('installer.step3Text') },
  ];

  return (
    <section className="installer-steps">
      <h2 className="installer-steps__title">{t('installer.stepsTitle')}</h2>
      <p className="installer-steps__subtitle">{t('installer.stepsSubtitle')}</p>

      <div className="installer-steps__track">
        {steps.map((step, index) => (
          <article key={step.title} className="installer-step">
            <div className="installer-step__num">{index + 1}</div>
            <h3 className="installer-step__title">{step.title}</h3>
            <p className="installer-step__text">{step.text}</p>
          </article>
        ))}
      </div>

      <p className="installer-steps__hint">{t('installer.uiUpdateHint')}</p>
    </section>
  );
}
