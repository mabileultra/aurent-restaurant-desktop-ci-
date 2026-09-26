import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import RstModal from './RstModal';
import { BaseButton } from '../../../components/ui';
import '../styles/touch-pickers.css';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseIso(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function buildMonthCells(month) {
  const first = startOfMonth(month);
  const weekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < weekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Touch-friendly calendar modal for POS date filters. */
export default function TouchDatePickerModal({
  open,
  title,
  value,
  onSelect,
  onClose,
  t,
}) {
  const { i18n } = useTranslation();
  const selected = parseIso(value);
  const [cursor, setCursor] = useState(() => startOfMonth(selected || new Date()));

  useEffect(() => {
    if (!open) return;
    setCursor(startOfMonth(parseIso(value) || new Date()));
  }, [open, value]);

  const cells = useMemo(() => buildMonthCells(cursor), [cursor]);
  const todayIso = toIsoDate(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = toIsoDate(tomorrow);

  if (!open) return null;

  const monthLabel = cursor.toLocaleDateString(i18n.language || 'ru', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <RstModal
      open={open}
      title={title}
      onClose={onClose}
      size="md"
      footer={(
        <>
          <BaseButton
            type="button"
            variant="ghost"
            onClick={() => {
              onSelect('');
              onClose();
            }}
          >
            {t('rst.touchDate.clear')}
          </BaseButton>
          <BaseButton type="button" variant="ghost" onClick={onClose}>
            {t('common.close')}
          </BaseButton>
        </>
      )}
    >
      <div className="rst-touch-date">
        <div className="rst-touch-date__presets">
          <button
            type="button"
            className="rst-touch-date__preset"
            onClick={() => {
              onSelect(todayIso);
              onClose();
            }}
          >
            {t('rst.touchDate.today')}
          </button>
          <button
            type="button"
            className="rst-touch-date__preset"
            onClick={() => {
              onSelect(tomorrowIso);
              onClose();
            }}
          >
            {t('rst.touchDate.tomorrow')}
          </button>
        </div>

        <div className="rst-touch-date__nav">
          <button
            type="button"
            className="rst-touch-date__nav-btn"
            onClick={() => setCursor((m) => addMonths(m, -1))}
            aria-label={t('rst.touchDate.prevMonth')}
          >
            ‹
          </button>
          <strong className="rst-touch-date__month">{monthLabel}</strong>
          <button
            type="button"
            className="rst-touch-date__nav-btn"
            onClick={() => setCursor((m) => addMonths(m, 1))}
            aria-label={t('rst.touchDate.nextMonth')}
          >
            ›
          </button>
        </div>

        <div className="rst-touch-date__weekdays">
          {WEEKDAY_KEYS.map((key) => (
            <span key={key}>{t(`rst.touchDate.weekday.${key}`)}</span>
          ))}
        </div>

        <div className="rst-touch-date__grid">
          {cells.map((day, index) => {
            if (!day) {
              return <span key={`e-${index}`} className="rst-touch-date__day is-empty" />;
            }
            const iso = toIsoDate(day);
            const active = value === iso;
            const isToday = iso === todayIso;
            return (
              <button
                key={iso}
                type="button"
                className={`rst-touch-date__day${active ? ' is-active' : ''}${isToday ? ' is-today' : ''}`}
                onClick={() => {
                  onSelect(iso);
                  onClose();
                }}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </RstModal>
  );
}
