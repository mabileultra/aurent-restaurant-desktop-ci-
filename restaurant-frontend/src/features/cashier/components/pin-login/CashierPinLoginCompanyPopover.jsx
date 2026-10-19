import { useEffect, useRef } from 'react';
import { Building2 } from 'lucide-react';
import { normalizeCompanyLoginCode, sanitizeCompanyLoginCodeInput } from '../../../../utils/authLogin';
import { isRestaurantDesktop } from '../../../../utils/restaurantDesktop';

export default function CashierPinLoginCompanyPopover({
  t,
  value,
  onChange,
  disabled,
  open,
  onToggle,
  onClose,
}) {
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const isValid = Boolean(normalizeCompanyLoginCode(value));
  // Hall desktop: keep the chip to enter/change code, but do not show digits on the button.
  const hideChipDigits = isRestaurantDesktop();

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, onClose]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div className="cashier-pin-login__company-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`cashier-pin-login__company-chip${open ? ' is-open' : ''}${isValid ? ' is-set' : ''}`}
        aria-label={t('cashierLogin.companyCode', { defaultValue: 'Код компании' })}
        title={t('cashierLogin.companyCode', { defaultValue: 'Код компании' })}
        disabled={disabled}
        onClick={onToggle}
      >
        <Building2 size={18} strokeWidth={2.25} aria-hidden />
        {isValid && !hideChipDigits ? (
          <span className="cashier-pin-login__company-chip-code">
            {normalizeCompanyLoginCode(value)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="cashier-pin-login__company-popover" role="dialog" aria-label={t('cashierLogin.companyCode')}>
          <label className="cashier-pin-login__company-label" htmlFor="cashier-company-code">
            {t('cashierLogin.companyCode', { defaultValue: 'Код компании' })}
          </label>
          <input
            ref={inputRef}
            id="cashier-company-code"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={5}
            className="cashier-pin-login__company-input"
            placeholder={t('cashierLogin.companyCodePlaceholder', { defaultValue: '97125' })}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(sanitizeCompanyLoginCodeInput(e.target.value))}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
