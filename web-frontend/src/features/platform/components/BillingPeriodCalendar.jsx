import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

function pad(n) {
  return String(n).padStart(2, '0');
}

export function toIsoDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftIsoDate(iso, days) {
  if (!iso) return toIsoDate(new Date());
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function BillingPeriodCalendar({ value, onChange, locale, t }) {
  const selected = value || toIsoDate(new Date());
  const selectedDate = new Date(`${selected}T12:00:00`);
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  useEffect(() => {
    const next = new Date(`${selected}T12:00:00`);
    if (Number.isNaN(next.getTime())) return;
    setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
  }, [selected]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const todayIso = toIsoDate(new Date());
  const weekdays = t('platform.billing.calendarWeekdays', { returnObjects: true });
  const cells = useMemo(
    () => monthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );
  const title = cursor.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const display = Number.isNaN(selectedDate.getTime())
    ? ''
    : selectedDate.toLocaleDateString(locale);

  const pick = (day) => {
    if (!day) return;
    onChange(`${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(day)}`);
    setOpen(false);
  };

  const shiftMonth = (delta) => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <div className="billing-date" ref={rootRef}>
      <button
        type="button"
        className="billing-date__field"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Calendar size={16} />
        <span>{display || t('platform.billing.invalidPeriodStart')}</span>
      </button>
      {open ? (
        <div className="billing-calendar billing-calendar--pop">
          <div className="billing-calendar__nav">
            <button type="button" className="billing-calendar__nav-btn" onClick={() => shiftMonth(-1)} aria-label={t('platform.billing.calendarPrev')}>
              <ChevronLeft size={16} />
            </button>
            <p className="billing-calendar__title">{title}</p>
            <button type="button" className="billing-calendar__nav-btn" onClick={() => shiftMonth(1)} aria-label={t('platform.billing.calendarNext')}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="billing-calendar__week">
            {(Array.isArray(weekdays) ? weekdays : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']).map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="billing-calendar__grid">
            {cells.map((day, index) => {
              if (!day) return <span key={`e-${index}`} className="billing-calendar__day billing-calendar__day--empty" />;
              const iso = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(day)}`;
              const isSelected = iso === selected;
              const isToday = iso === todayIso;
              const isPast = iso < todayIso;
              return (
                <button
                  key={iso}
                  type="button"
                  className={[
                    'billing-calendar__day',
                    isSelected ? 'billing-calendar__day--selected' : '',
                    isToday ? 'billing-calendar__day--today' : '',
                    isPast ? 'billing-calendar__day--past' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => pick(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
