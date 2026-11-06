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
        className="fixed z-[210] min-w-[280px] max-w-[90vw] rounded-lg border border-slate-200 bg-white py-2 text-left shadow-xl dark:!border-slate-700 dark:!bg-slate-900"
        style={{
          top: `${menu.rect.bottom + 4}px`,
          right: `${window.innerWidth - menu.rect.right}px`,
        }}
      >
        <div className="flex flex-wrap gap-1 px-2">
          <button
            type="button"
            className="admin-link flex-1 rounded px-2 py-2 text-left text-xs hover:bg-[color:var(--admin-brand-soft)]"
            onClick={onExportSales}
          >
            {t('zReports.rowExportSales')}
          </button>
          <button
            type="button"
            className="admin-link flex-1 rounded px-2 py-2 text-left text-xs hover:bg-[color:var(--admin-brand-soft)]"
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
