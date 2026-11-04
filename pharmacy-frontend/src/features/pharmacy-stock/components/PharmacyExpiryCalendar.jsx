import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { formatIsoToDisplay } from '../utils/smartExpiryInput';

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAYS_UZ = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

function parseIso(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function toIso(date) {
  const y = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function startOfGrid(year, month) {
  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  return new Date(year, month, 1 - mondayOffset);
}

export default function PharmacyExpiryCalendar({
  selectedIso,
  locale = 'ru',
  onPick,
}) {
  const selected = parseIso(selectedIso);
  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  const [cursor, setCursor] = useState(() => selected || today);

  useEffect(() => {
    if (selected) setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [selectedIso]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const isUz = String(locale).toLowerCase().startsWith('uz');
  const weekdays = isUz ? WEEKDAYS_UZ : WEEKDAYS_RU;
  const title = new Date(year, month, 1).toLocaleDateString(
    isUz ? 'uz-UZ' : 'ru-RU',
    { month: 'long', year: 'numeric' },
  );

  const cells = [];
  const gridStart = startOfGrid(year, month);
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push(date);
  }

  const shiftMonth = (delta) => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <div className="pharm-expiry-cal" role="dialog" aria-label={formatIsoToDisplay(selectedIso) || title}>
      <div className="pharm-expiry-cal__head">
        <div className="pharm-expiry-cal__navs">
          <button type="button" className="pharm-expiry-cal__nav" onClick={() => shiftMonth(-12)} aria-label="prev-year">
            <ChevronsLeft size={15} />
          </button>
          <button type="button" className="pharm-expiry-cal__nav" onClick={() => shiftMonth(-1)} aria-label="prev">
            <ChevronLeft size={16} />
          </button>
        </div>
        <span className="pharm-expiry-cal__title">{title}</span>
        <div className="pharm-expiry-cal__navs">
          <button type="button" className="pharm-expiry-cal__nav" onClick={() => shiftMonth(1)} aria-label="next">
            <ChevronRight size={16} />
          </button>
          <button type="button" className="pharm-expiry-cal__nav" onClick={() => shiftMonth(12)} aria-label="next-year">
            <ChevronsRight size={15} />
          </button>
        </div>
      </div>
      <div className="pharm-expiry-cal__week">
        {weekdays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="pharm-expiry-cal__grid">
        {cells.map((date) => {
          const iso = toIso(date);
          const outside = date.getMonth() !== month;
          const isToday = toIso(date) === toIso(today);
          const isSelected = selectedIso === iso;
          return (
            <button
              key={iso + String(outside)}
              type="button"
              className={[
                'pharm-expiry-cal__day',
                outside ? 'is-muted' : '',
                isToday ? 'is-today' : '',
                isSelected ? 'is-selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onPick(iso)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
