import { FileText, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useConnectivityStore } from '../../../store/connectivityStore';
import { openPharmacyExternalUrl } from '../utils/pharmacyIntegrationLinks';
import { PHARMACY_EXTERNAL_URLS } from '../constants/pharmacyQuickLinks';

/**
 * DMED + loyalty cards in the pharmacy pay rail (mock layout).
 * Apply / quota / redeem are UI actions; sale still uses PINFL + phone extras.
 */
export default function PharmacyPayPatientCards({
  pinfl,
  onPinflChange,
  loyaltyPhone,
  onLoyaltyPhoneChange,
  disabled = false,
  pinflRequired = false,
}) {
  const { t } = useTranslation();
  const apiOnline = useConnectivityStore((s) => s.apiOnline);
  const online = apiOnline !== false;

  const handleApplyDmed = () => {
    if (disabled) return;
    const digits = String(pinfl || '').replace(/\D/g, '');
    if (digits.length < 14) {
      toast.error(t('pharmacyCashier.pay.pinflRequired'));
      return;
    }
    toast.success(t('pharmacyCashier.pay.dmedApplied'));
  };

  const handleCheckQuota = () => {
    if (disabled) return;
    openPharmacyExternalUrl(PHARMACY_EXTERNAL_URLS.dmed);
  };

  const handleRedeem = () => {
    if (disabled) return;
    const phone = String(loyaltyPhone || '').trim();
    if (phone.replace(/\D/g, '').length < 9) {
      toast.error(t('pharmacyCashier.pay.loyaltyPhoneRequired'));
      return;
    }
    toast(t('pharmacyCashier.pay.loyaltyRedeemSoon'));
  };

  return (
    <div className="pharmacy-pay-patient">
      <section
        className={`pharmacy-pay-patient__card pharmacy-pay-patient__card--dmed${
          pinflRequired ? ' is-required' : ''
        }`}
      >
        <header className="pharmacy-pay-patient__head">
          <span className="pharmacy-pay-patient__title">
            <FileText size={15} strokeWidth={2.2} aria-hidden />
            {t('pharmacyCashier.pay.dmedTitle')}
          </span>
          <span
            className={`pharmacy-pay-patient__badge pharmacy-pay-patient__badge--dmed${
              online ? ' is-online' : ' is-offline'
            }`}
          >
            {online ? t('pharmacyCashier.pay.dmedOnline') : t('pharmacyCashier.pay.dmedOffline')}
          </span>
        </header>
        <div className="pharmacy-pay-patient__row">
          <input
            type="text"
            inputMode="numeric"
            maxLength={14}
            className="pharmacy-pay-patient__input pharmacy-pay-patient__input--dmed"
            value={pinfl}
            disabled={disabled}
            onChange={(e) => onPinflChange(e.target.value.replace(/\D/g, '').slice(0, 14))}
            placeholder={t('pharmacyCashier.pay.dmedPh')}
            autoComplete="off"
            aria-label={t('pharmacyCashier.pay.dmedTitle')}
          />
          <button
            type="button"
            className="pharmacy-pay-patient__btn pharmacy-pay-patient__btn--dmed"
            disabled={disabled}
            onClick={handleApplyDmed}
          >
            {t('pharmacyCashier.pay.dmedApply')}
          </button>
        </div>
        <div className="pharmacy-pay-patient__meta">
          <span>
            {t('pharmacyCashier.pay.dmedCompensation', { amount: '0', pct: '0' })}
          </span>
          <button
            type="button"
            className="pharmacy-pay-patient__link"
            disabled={disabled}
            onClick={handleCheckQuota}
          >
            {t('pharmacyCashier.pay.dmedQuota')}
          </button>
        </div>
      </section>

      <section className="pharmacy-pay-patient__card pharmacy-pay-patient__card--loyalty">
        <header className="pharmacy-pay-patient__head">
          <span className="pharmacy-pay-patient__title">
            <UserRound size={15} strokeWidth={2.2} aria-hidden />
            {t('pharmacyCashier.pay.loyaltyTitle')}
          </span>
          <span className="pharmacy-pay-patient__badge pharmacy-pay-patient__badge--loyalty">
            {t('pharmacyCashier.pay.loyaltyBonus', { n: '0' })}
          </span>
        </header>
        <div className="pharmacy-pay-patient__row">
          <input
            type="tel"
            className="pharmacy-pay-patient__input"
            value={loyaltyPhone}
            disabled={disabled}
            onChange={(e) => onLoyaltyPhoneChange(e.target.value)}
            placeholder="+998 __ ___ __ __"
            autoComplete="tel"
            aria-label={t('pharmacyCashier.pay.loyaltyTitle')}
          />
          <button
            type="button"
            className="pharmacy-pay-patient__btn pharmacy-pay-patient__btn--loyalty"
            disabled={disabled}
            onClick={handleRedeem}
          >
            {t('pharmacyCashier.pay.loyaltyRedeem')}
          </button>
        </div>
      </section>
    </div>
  );
}
