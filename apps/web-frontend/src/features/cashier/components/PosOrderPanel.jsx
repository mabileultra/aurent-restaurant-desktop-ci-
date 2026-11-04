import { useTranslation } from 'react-i18next';
import { usePosOrderPanel } from '../hooks/usePosOrderPanel';
import PosOrderPanelLine from './pos-order-panel/PosOrderPanelLine';
import PosOrderPanelTotalsFoot from './pos-order-panel/PosOrderPanelTotalsFoot';
import PosParkedCartsBar from './pos-order-panel/PosParkedCartsBar';
import PosRegisterFinder from './pos-order-panel/PosRegisterFinder';

export default function PosOrderPanel({
  items,
  selectedLineId,
  onSelectLine,
  onQtyDelta,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
  total,
  className = '',
  showTotalsFoot = false,
  title,
  subtitle,
  taxTotal,
  priceEditable = true,
  hideHeader = false,
  onHold,
  onClear,
  hasParkedCart = false,
  parkedCarts = [],
  onRestoreParked,
  onRemoveParked,
  onClearParked,
  registerFinder = null,
  searchInputRef = null,
}) {
  const { t } = useTranslation();
  const p = usePosOrderPanel({
    items,
    selectedLineId,
    onUpdateQuantity,
    onUpdatePrice,
    total,
    taxTotal,
  });

  const panelTitle = title ?? t('pos.currentCheck');
  const showFoot = showTotalsFoot && (items.length > 0 || hasParkedCart) && !registerFinder?.pickerOpen;
  const holdIsRestore = items.length === 0 && parkedCarts.length === 1;
  const showCart = !registerFinder?.pickerOpen;
  const showParked = showFoot && parkedCarts.length > 0;

  return (
    <section className={`pos-order-panel pos-order-panel--register${className ? ` ${className}` : ''}`}>
      {registerFinder ? (
        <PosRegisterFinder
          ref={searchInputRef}
          t={t}
          {...registerFinder}
        />
      ) : !hideHeader ? (
        <header className="pos-order-panel__head">
          <h2 className="pos-order-panel__title">{panelTitle}</h2>
          {subtitle ? <p className="pos-order-panel__subtitle">{subtitle}</p> : null}
        </header>
      ) : null}

      {showCart ? (
        <div className="pos-order-panel__list">
          <div className="pos-cart-table">
            <div className="pos-cart-table__head" role="row">
              <span className="pos-cart-table__col pos-cart-table__col--name">{t('pos.colName')}</span>
              <span className="pos-cart-table__col pos-cart-table__col--price">{t('pos.colPrice')}</span>
              <span className="pos-cart-table__col pos-cart-table__col--qty">{t('pos.colQty')}</span>
              <span className="pos-cart-table__col pos-cart-table__col--sum">{t('pos.colSum')}</span>
              <span className="pos-cart-table__col pos-cart-table__col--remove" aria-hidden />
            </div>
            <ul className="pos-cart-table__body">
              {items.length === 0 ? (
                <li className="pos-cart-table__row pos-cart-table__row--empty" role="row">
                  <div className="pos-cart-table__col pos-cart-table__col--name">
                    <span className="pos-cart-table__empty-hint">
                      {hasParkedCart ? t('pos.parkedCartHint') : t('pos.cartEmpty')}
                    </span>
                  </div>
                  <div className="pos-cart-table__col pos-cart-table__col--price" aria-hidden />
                  <div className="pos-cart-table__col pos-cart-table__col--qty" aria-hidden />
                  <div className="pos-cart-table__col pos-cart-table__col--sum" aria-hidden />
                  <div className="pos-cart-table__col pos-cart-table__col--remove" aria-hidden />
                </li>
              ) : (
                items.map((item) => (
                  <PosOrderPanelLine
                    key={item.lineId}
                    item={item}
                    active={selectedLineId === item.lineId}
                    rowRef={(el) => {
                      if (el) p.rowRefs.current[item.lineId] = el;
                      else delete p.rowRefs.current[item.lineId];
                    }}
                    onSelectLine={onSelectLine}
                    onQtyDelta={onQtyDelta}
                    onRemove={onRemove}
                    editingPriceLineId={p.editingPriceLineId}
                    priceDraft={p.priceDraft}
                    setPriceDraft={p.setPriceDraft}
                    setEditingPriceLineId={p.setEditingPriceLineId}
                    commitPrice={p.commitPrice}
                    editingQtyLineId={p.editingQtyLineId}
                    setEditingQtyLineId={p.setEditingQtyLineId}
                    qtyDraft={p.qtyDraft}
                    setQtyDraft={p.setQtyDraft}
                    startQtyEdit={p.startQtyEdit}
                    commitQty={p.commitQty}
                    priceEditable={priceEditable}
                    t={t}
                  />
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}

      {showParked ? (
        <PosParkedCartsBar
          t={t}
          parkedCarts={parkedCarts}
          onRestore={onRestoreParked}
          onRemove={onRemoveParked}
          onClearAll={onClearParked}
        />
      ) : null}

      {showFoot ? (
        <PosOrderPanelTotalsFoot
          t={t}
          positionsCount={p.positionsCount}
          totalQty={p.totalQty}
          taxTotal={p.taxTotal}
          taxRateLabel={p.taxRateLabel}
          onHold={onHold}
          onClear={onClear}
          holdDisabled={!onHold || (items.length === 0 && !hasParkedCart)}
          clearDisabled={!onClear || items.length === 0}
          holdIsRestore={holdIsRestore}
          holdChoose={items.length === 0 && parkedCarts.length > 1}
        />
      ) : null}
    </section>
  );
}
