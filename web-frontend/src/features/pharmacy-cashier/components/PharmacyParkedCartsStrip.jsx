import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Archive, Trash2 } from 'lucide-react';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { lineSubtotal } from '../../../store/cartStore';
import { round2 } from '../../../utils/taxAmounts';
import '../styles/pharmacy-parked-cards.css';

function parkedTotal(ticket) {
  const lines = round2((ticket.items || []).reduce((acc, item) => acc + lineSubtotal(item), 0));
  return round2(Math.max(0, lines - (Number(ticket.orderDiscountAmount) || 0)));
}

function formatParkedTime(parkedAt) {
  if (!parkedAt) return '';
  try {
    return new Date(parkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** Кнопка рядом с «Новый чек»: по нажатию — карточки 1, 2, 3. */
export default function PharmacyParkedCartsStrip({
  t,
  parkedCarts = [],
  onRestore,
  onRemove,
  onClearAll,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const count = parkedCarts.length;

  const ordered = [...parkedCarts].sort(
    (a, b) => (Number(a.parkedAt) || 0) - (Number(b.parkedAt) || 0),
  );

  useEffect(() => {
    if (!count) setOpen(false);
  }, [count]);

  useEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      setBox({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    place();
    const onPointer = (event) => {
      const target = event.target;
      if (btnRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const panel = open && box ? (
    <div
      ref={panelRef}
      className="pharmacy-parked-pop"
      role="dialog"
      aria-label={t('pos.parkedCartsTitle')}
      style={{ top: box.top, right: box.right }}
    >
      <ul className="pharmacy-parked-pop__list">
        {ordered.map((ticket, index) => {
          const slot = index + 1;
          const positions = ticket.items?.length ?? 0;
          const total = parkedTotal(ticket);
          const time = formatParkedTime(ticket.parkedAt);
          const checkLabel = ticket.checkNo
            ? t('pos.parkedCartCheck', { no: ticket.checkNo })
            : t('pos.parkedCartUntitled');
          return (
            <li key={ticket.id} className="pharmacy-parked-pop__item">
              <button
                type="button"
                className="pharmacy-parked-pop__card"
                onClick={() => {
                  onRestore?.(ticket.id);
                  setOpen(false);
                }}
                title={t('pos.parkedCartRestore')}
              >
                <span className="pharmacy-parked-pop__slot" aria-hidden>{slot}</span>
                <span className="pharmacy-parked-pop__body">
                  <span className="pharmacy-parked-pop__label">
                    {t('pharmacyCashier.parkedSlot', {
                      n: slot,
                      defaultValue: 'Отложенный №{{n}}',
                    })}
                  </span>
                  <span className="pharmacy-parked-pop__check">{checkLabel}</span>
                  <span className="pharmacy-parked-pop__meta">
                    {t('pos.parkedCartMeta', { count: positions, sum: fmt(total) })}
                    {time ? ` · ${time}` : ''}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="pharmacy-parked-pop__remove"
                onClick={() => onRemove?.(ticket.id)}
                aria-label={t('pos.parkedCartRemove')}
                title={t('pos.parkedCartRemove')}
              >
                <Trash2 size={14} strokeWidth={2.25} />
              </button>
            </li>
          );
        })}
      </ul>
      {count > 0 ? (
        <button
          type="button"
          className="pharmacy-parked-pop__clear"
          onClick={() => {
            onClearAll?.();
            setOpen(false);
          }}
        >
          {t('pos.parkedCartsClearAll')}
        </button>
      ) : null}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`pharmacy-cart-pane-head__btn pharmacy-parked-lookup${open ? ' is-open' : ''}`}
        disabled={disabled || count === 0}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Archive size={14} strokeWidth={2.25} aria-hidden />
        {t('pharmacyCashier.parkedLookup', { defaultValue: 'Отложенные' })}
        {count > 0 ? <span className="pharmacy-parked-lookup__count">{count}</span> : null}
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </>
  );
}
