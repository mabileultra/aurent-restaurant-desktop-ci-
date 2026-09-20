export default function PosHardwareBar({ t }) {
  return (
    <footer className="rst-pos__hw">
      <span>{t('rst.pos.hwFiscal')}</span>
      <span>{t('rst.pos.hwPin')}</span>
      <span>{t('rst.pos.hwKitchen')}</span>
      <span className="rst-pos__hw-right">{t('rst.pos.hwOnline')}</span>
    </footer>
  );
}
