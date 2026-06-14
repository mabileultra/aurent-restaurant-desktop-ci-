import { X } from 'lucide-react';
import { BaseModal } from '../../../../components/ui';
import '../../../../styles/finance/detail-modal.css';

export default function FinanceDetailModalShell({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
  layout = 'compact',
}) {
  const size = wide ? 'xl' : layout === 'record' ? 'lg' : 'md';
  const layoutClass = layout === 'record' ? 'finance-detail-modal--record' : '';

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      hideHeader
      size={size}
      className={`finance-modal finance-detail-modal ${layoutClass} ${wide ? 'finance-detail-modal--wide' : ''}`.trim()}
      bodyClassName="finance-modal__body"
    >
      <div className="finance-detail-modal__layout">
        <div className="finance-detail-modal__header">
          <h2 className="finance-detail-modal__title">{title}</h2>
          <button type="button" className="finance-detail-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="finance-detail-modal__scroll">
          <div className="finance-detail-modal__body">{children}</div>
        </div>
        {footer ? <div className="finance-detail-modal__footer">{footer}</div> : null}
      </div>
    </BaseModal>
  );
}
