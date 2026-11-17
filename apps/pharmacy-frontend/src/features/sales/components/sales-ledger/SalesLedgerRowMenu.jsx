import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

export default function SalesLedgerRowMenu({ menu, t, onClose, onPrint, onReturn }) {
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
        className="fixed z-[210] min-w-[180px] rounded-card border border-line bg-surface p-1 text-left shadow-elevated"
        style={{
          top: `${menu.rect.bottom + 4}px`,
          right: `${window.innerWidth - menu.rect.right}px`,
        }}
      >
        <button
          type="button"
          className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-ink hover:bg-primary-50"
          onClick={() => {
            onPrint(menu.row.id);
            onClose();
          }}
        >
          {t('salesLedger.printFiscal')}
        </button>
        <Link
          to={`/receipt/${menu.row.receiptNumber}`}
          className="block rounded-lg px-3 py-2 text-xs font-medium text-ink hover:bg-primary-50"
          onClick={onClose}
        >
          {t('salesLedger.openReceipt')}
        </Link>
        {menu.row.status !== 'VOIDED' && (
          <button
            type="button"
            className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-danger-text hover:bg-danger-soft"
            onClick={() => {
              onReturn(menu.row.id);
              onClose();
            }}
          >
            {t('salesLedger.voidSale')}
          </button>
        )}
      </div>
    </>,
    document.body
  );
}
