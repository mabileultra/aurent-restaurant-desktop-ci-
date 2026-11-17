export default function BarcodePrintPageHeader({ t }) {
  return (
    <header className="barcode-print-page__header">
      <h1 className="text-xl font-bold text-ink">{t('usersBarcodePrint.title')}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t('usersBarcodePrint.intro')}</p>
    </header>
  );
}
