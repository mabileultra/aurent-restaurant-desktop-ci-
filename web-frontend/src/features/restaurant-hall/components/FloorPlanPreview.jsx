import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { formatTableCheckPreviewItems } from '../utils/tableCheckPreview';
import '../styles/restaurant-hall.css';

const STATUS_CLASS = {
  FREE: 'restaurant-hall-plan__table--free',
  OCCUPIED: 'restaurant-hall-plan__table--occupied',
  RESERVED: 'restaurant-hall-plan__table--reserved',
};

export default function FloorPlanPreview({
  hall,
  onTableClick,
  t,
  showStatus = false,
  showCheckPreview = false,
  selectedTableId = null,
}) {
  if (!hall) {
    return (
      <div className="restaurant-hall-plan restaurant-hall-plan--empty">
        <p>{t('restaurantHall.selectHall')}</p>
      </div>
    );
  }

  return (
    <div className="restaurant-hall-plan">
      <div className="restaurant-hall-plan__canvas">
        {(hall.tables ?? []).map((table) => {
          const session = table.activeSession;
          const hasCheckPreview = showCheckPreview && table.status === 'OCCUPIED' && session;
          const previewItems = hasCheckPreview ? formatTableCheckPreviewItems(session) : '';

          return (
            <button
              key={table.id}
              type="button"
              className={`restaurant-hall-plan__table ${STATUS_CLASS[table.status] ?? STATUS_CLASS.FREE}${selectedTableId === table.id ? ' is-selected' : ''}${hasCheckPreview ? ' restaurant-hall-plan__table--with-check' : ''}`}
              style={{
                left: table.posX,
                top: table.posY,
                width: table.width,
                height: table.height,
              }}
              onClick={() => onTableClick?.(table)}
            >
              <span className="restaurant-hall-plan__table-code">{table.code}</span>

              {hasCheckPreview ? (
                <div className="restaurant-hall-plan__table-check">
                  <span className="restaurant-hall-plan__table-check-total">{fmt(session.subtotal)}</span>
                  <span className="restaurant-hall-plan__table-check-meta">
                    {t('restaurantCashier.tableCheckLines', { count: session.linesCount })}
                    {session.guestCount > 0 ? (
                      <>
                        {' · '}
                        {t('restaurantCashier.tableCheckGuests', { count: session.guestCount })}
                      </>
                    ) : null}
                  </span>
                  {previewItems ? (
                    <span className="restaurant-hall-plan__table-check-items">{previewItems}</span>
                  ) : (
                    <span className="restaurant-hall-plan__table-check-empty">
                      {t('restaurantCashier.tableCheckEmpty')}
                    </span>
                  )}
                </div>
              ) : null}

              {!hasCheckPreview && showStatus ? (
                <span className="restaurant-hall-plan__table-status">
                  {t(`restaurantHall.status_${table.status ?? 'FREE'}`)}
                </span>
              ) : null}

              {!hasCheckPreview ? (
                <span className="restaurant-hall-plan__table-seats">{table.seatCount}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
