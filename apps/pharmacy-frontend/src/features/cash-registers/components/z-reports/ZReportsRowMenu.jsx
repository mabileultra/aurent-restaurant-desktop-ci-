import { createPortal } from 'react-dom';

export default function ZReportsRowMenu({
  t,
  menu,
  onClose,
  onExportSales,
  onPrint,
}) {
  if (!menu) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[200] cursor-default"
        aria-label="close menu"
        onClick={onClose}
      />
      <div
        role="menu"
        className="fixed z-[210] min-w-[280px] max-w-[90vw] rounded-card border border-line bg-surface p-1.5 text-left shadow-elevated"
        style={{
          top: `${menu.rect.bottom + 4}px`,
          right: `${window.innerWidth - menu.rect.right}px`,
        }}
      >
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className="flex-1 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-primary-700 hover:bg-primary-50"
            onClick={onExportSales}
          >
            {t('zReports.rowExportSales')}
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-primary-700 hover:bg-primary-50"
            onClick={onPrint}
          >
            {t('receipt.print')}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
