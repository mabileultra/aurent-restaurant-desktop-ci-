import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  formatIsoToDisplay,
  parseSmartExpiryInput,
} from '../utils/smartExpiryInput';
import PharmacyExpiryCalendar from './PharmacyExpiryCalendar';

export function formatLineMoney(value) {
  const raw = String(value ?? '').replace(/\s/g, '');
  if (raw === '' || Number.isNaN(Number(raw))) return String(value ?? '');
  const [intPart, frac] = raw.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return frac != null ? `${grouped}.${frac}` : grouped;
}

export function stripLineMoney(value) {
  return String(value ?? '').replace(/\s/g, '');
}

export default function PharmacyReceiptLineFields({
  t,
  line,
  productName,
  stockLocked = false,
}) {
  const {
    form,
    setForm,
    patch,
    docMarkup,
    docRetail,
    applyDocMarkup,
  } = line;

  return (
    <div>
      {productName ? (
        <p className="pharm-line-modal__product">{productName}</p>
      ) : null}

      <section className="pharm-line-modal__section">
        <h3 className="pharm-line-modal__section-title">{t('pharmacyStock.sectionMain')}</h3>

        <div className="pharm-line-modal__row pharm-line-modal__row--2">
          <div className="pharm-line-modal__field">
            <span className="pharm-line-modal__label">{t('pharmacyStock.quantity')}</span>
            <div className="pharm-line-modal__qty-group">
              <input
                inputMode="numeric"
                className="pharm-line-modal__input pharm-line-modal__input--num"
                value={form.packs}
                disabled={stockLocked}
                onChange={(e) => patch('packs', stripLineMoney(e.target.value))}
              />
              <span className="pharm-line-modal__plus" aria-hidden>+</span>
              <input
                inputMode="numeric"
                className="pharm-line-modal__input pharm-line-modal__input--num"
                value={form.units}
                disabled={stockLocked}
                onChange={(e) => patch('units', stripLineMoney(e.target.value))}
              />
            </div>
          </div>
          <MoneyField
            label={t('pharmacyStock.unitsInPack')}
            value={form.unitsInPack}
            readOnly={stockLocked}
            onChange={(v) => patch('unitsInPack', v)}
          />
        </div>

        <div className="pharm-line-modal__row pharm-line-modal__row--3">
          <MoneyField
            label={t('pharmacyStock.purchasePrice')}
            value={form.purchasePrice}
            onChange={(v) => patch('purchasePrice', v)}
          />
          <MoneyField
            label={t('pharmacyStock.vatRate')}
            value={form.vatPercent}
            onChange={(v) => patch('vatPercent', v)}
          />
          <MoneyField
            label={t('pharmacyStock.purchaseWithVat')}
            value={form.purchasePriceWithVat}
            onChange={(v) => patch('purchasePriceWithVat', v)}
          />
        </div>
      </section>

      <section className="pharm-line-modal__section">
        <h3 className="pharm-line-modal__section-title">{t('pharmacyStock.sectionRetail')}</h3>
        <div className="pharm-line-modal__row pharm-line-modal__row--2">
          <MoneyField
            label={t('pharmacyStock.markupDoc')}
            value={docMarkup}
            onChange={applyDocMarkup}
          />
          <MoneyField
            label={t('pharmacyStock.retailPrice')}
            value={docRetail}
            readOnly
          />
        </div>
        <div className="pharm-line-modal__row pharm-line-modal__row--2">
          <MoneyField
            label={t('pharmacyStock.markupLine')}
            value={form.markupPercent}
            onChange={(v) => patch('markupPercent', v)}
          />
          <MoneyField
            label={t('pharmacyStock.retailPrice')}
            value={form.retailPrice}
            onChange={(v) => patch('retailPrice', v)}
          />
        </div>
        <div className="pharm-line-modal__row pharm-line-modal__row--2">
          <MoneyField
            label={t('pharmacyStock.unitPrice')}
            value={form.unitRetailPrice}
            onChange={(v) => patch('unitRetailPrice', v)}
          />
          <span aria-hidden />
        </div>
      </section>

      <section className="pharm-line-modal__section pharm-line-modal__section--last">
        <div className="pharm-line-modal__row pharm-line-modal__row--2">
          <label className="pharm-line-modal__field">
            <span className="pharm-line-modal__label">{t('pharmacyStock.batch')}</span>
            <input
              className="pharm-line-modal__input"
              value={form.batchNumber}
              disabled={stockLocked}
              onChange={(e) => patch('batchNumber', e.target.value)}
            />
          </label>
          <label className="pharm-line-modal__field relative">
            <span className="pharm-line-modal__label">{t('pharmacyStock.expiry')}</span>
            <ExpirySmartInput
              t={t}
              form={form}
              setForm={setForm}
              patch={patch}
              disabled={stockLocked}
            />
          </label>
        </div>
      </section>
    </div>
  );
}

function MoneyField({ label, value, onChange, readOnly = false }) {
  return (
    <label className="pharm-line-modal__field">
      <span className="pharm-line-modal__label">{label}</span>
      <input
        inputMode="decimal"
        className="pharm-line-modal__input pharm-line-modal__input--num"
        value={formatLineMoney(value)}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={readOnly ? undefined : (e) => onChange(stripLineMoney(e.target.value))}
      />
    </label>
  );
}

function ExpirySmartInput({ t, form, setForm, patch, disabled = false }) {
  const { i18n } = useTranslation();
  const wrapRef = useRef(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pos, setPos] = useState(null);

  const commitExpiry = (raw = form.expiryInput) => {
    const text = String(raw ?? '').trim();
    if (!text) {
      setForm((prev) => ({ ...prev, expiryDate: '', expiryInput: '' }));
      return;
    }
    const parsed = parseSmartExpiryInput(text);
    if (!parsed) return;
    setForm((prev) => ({
      ...prev,
      expiryDate: parsed,
      expiryInput: formatIsoToDisplay(parsed),
    }));
  };

  const pickIso = (iso) => {
    setForm((prev) => ({
      ...prev,
      expiryDate: iso,
      expiryInput: formatIsoToDisplay(iso),
    }));
    setCalendarOpen(false);
  };

  useLayoutEffect(() => {
    if (!calendarOpen || !wrapRef.current) {
      setPos(null);
      return undefined;
    }
    const place = () => {
      const rect = wrapRef.current.getBoundingClientRect();
      const width = 264;
      const height = 292;
      let left = rect.left;
      let top = rect.bottom + 6;
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - width - 8);
      }
      if (top + height > window.innerHeight - 8) {
        top = Math.max(8, rect.top - height - 6);
      }
      setPos({ top, left, width });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [calendarOpen]);

  useLayoutEffect(() => {
    if (!calendarOpen) return undefined;
    const onDown = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (e.target?.closest?.('.pharm-expiry-cal')) return;
      setCalendarOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [calendarOpen]);

  return (
    <>
      <div className="pharm-line-modal__expiry-wrap" ref={wrapRef}>
        <input
          className={`pharm-line-modal__input pharm-line-modal__input--expiry${calendarOpen ? ' is-active' : ''}`}
          value={form.expiryInput}
          placeholder={t('pharmacyStock.expiryPlaceholder')}
          inputMode="numeric"
          disabled={disabled}
          onChange={(e) => patch('expiryInput', e.target.value)}
          onBlur={() => commitExpiry()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitExpiry();
              setCalendarOpen(false);
            }
            if (e.key === 'Escape') setCalendarOpen(false);
          }}
        />
        <button
          type="button"
          className="pharm-line-modal__expiry-info"
          title={t('pharmacyStock.expiryPickDate')}
          aria-label={t('pharmacyStock.expiryPickDate')}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (disabled) return;
            setCalendarOpen((open) => !open);
          }}
        >
          <CalendarDays size={15} strokeWidth={2.2} />
        </button>
      </div>
      {calendarOpen && pos
        ? createPortal(
          <div style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 80 }}>
            <PharmacyExpiryCalendar
              selectedIso={form.expiryDate}
              locale={i18n.language}
              onPick={pickIso}
            />
          </div>,
          document.body,
        )
        : null}
    </>
  );
}

