import { CARD_CATEGORY } from '@aurent/shared-types';
import {
  isValidRrn,
  isValidSocialCardInput,
  maskSocialCardNumber,
  normalizeCardCategory,
  normalizeRrn,
} from '@aurent/shared-fiscal';

export const CARD_CATEGORY_OPTIONS = Object.freeze([
  { id: CARD_CATEGORY.PERSONAL, labelKey: 'pos.cardPersonal', fallback: 'Личная' },
  { id: CARD_CATEGORY.CORPORATE, labelKey: 'pos.cardCorporate', fallback: 'Корпоративная' },
  { id: CARD_CATEGORY.SOCIAL, labelKey: 'pos.cardSocial', fallback: 'Социальная' },
]);

export function createInitialCardDetails(initialCategory = CARD_CATEGORY.PERSONAL) {
  return {
    cardCategory: normalizeCardCategory(initialCategory) || CARD_CATEGORY.PERSONAL,
    rrn: '',
    socialCardInput: '',
  };
}

/**
 * Валидирует и нормализует реквизиты оплаты картой (тип карты, RRN, маска соц. карты).
 * @param {{ cardCategory: string, rrn: string, socialCardInput: string }} state
 * @param {Function} t
 * @returns {{ ok: true, data: { cardCategory: string, rrn: string, socialCardNumber: string | null } } | { ok: false, field: string, error: string }}
 */
export function validateAndNormalizeCardDetails(state, t) {
  const cardCategory = normalizeCardCategory(state?.cardCategory) || CARD_CATEGORY.PERSONAL;
  const rrn = normalizeRrn(state?.rrn);
  if (!isValidRrn(rrn)) {
    return {
      ok: false,
      field: 'rrn',
      error: t('pos.cardRrnRequired', { defaultValue: 'Введите код RRN (ровно 12 цифр)' }),
    };
  }

  let socialCardNumber = null;
  if (cardCategory === CARD_CATEGORY.SOCIAL) {
    if (!isValidSocialCardInput(state?.socialCardInput)) {
      return {
        ok: false,
        field: 'socialCardInput',
        error: t('pos.socialCardRequired', {
          defaultValue: 'Введите номер социальной карты (минимум первые 4 и последние 4 цифры)',
        }),
      };
    }
    socialCardNumber = maskSocialCardNumber(state?.socialCardInput);
  }

  return {
    ok: true,
    data: {
      cardCategory,
      rrn,
      socialCardNumber,
    },
  };
}

/**
 * Общий блок выбора категории карты (Личная / Корпоративная / Социальная), RRN и номера соц. карты.
 */
export default function CardPaymentFields({
  value,
  onChange,
  error = null,
  disabled = false,
  autoFocusRrn = false,
  idPrefix = 'pos-card',
  t,
}) {
  const category = normalizeCardCategory(value?.cardCategory) || CARD_CATEGORY.PERSONAL;
  const isSocial = category === CARD_CATEGORY.SOCIAL;
  const maskedPreview = isSocial ? maskSocialCardNumber(value?.socialCardInput) : null;
  const rrnInputId = `${idPrefix}-rrn-input`;
  const socialInputId = `${idPrefix}-social-input`;

  const patch = (next) => {
    onChange?.({
      ...value,
      ...next,
    });
  };

  return (
    <div className="pos-card-fields">
      <div className="pos-card-fields__group">
        <span className="pos-card-fields__label">
          {t('pos.cardCategoryLabel', { defaultValue: 'Тип карты' })}
        </span>
        <div
          className="pos-card-fields__categories"
          role="radiogroup"
          aria-label={t('pos.cardCategoryLabel', { defaultValue: 'Тип карты' })}
        >
          {CARD_CATEGORY_OPTIONS.map((opt) => {
            const active = category === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                className={`pos-card-fields__cat-btn${active ? ' is-active' : ''}`}
                onClick={() =>
                  patch({
                    cardCategory: opt.id,
                    ...(opt.id !== CARD_CATEGORY.SOCIAL ? { socialCardInput: '' } : {}),
                  })
                }
              >
                {t(opt.labelKey, { defaultValue: opt.fallback })}
              </button>
            );
          })}
        </div>
      </div>

      {isSocial ? (
        <div className="pos-card-fields__group">
          <label className="pos-card-fields__label" htmlFor={socialInputId}>
            {t('pos.socialCardLabel', { defaultValue: 'Номер социальной карты' })}
          </label>
          <input
            id={socialInputId}
            type="text"
            inputMode="text"
            autoComplete="off"
            disabled={disabled}
            className={`pos-card-fields__input${
              error?.field === 'socialCardInput' ? ' pos-card-fields__input--error' : ''
            }`}
            placeholder={t('pos.socialCardPlaceholder', {
              defaultValue: '16 цифр или маска со слип-чека (напр. 986003******8031)',
            })}
            value={value?.socialCardInput || ''}
            onChange={(e) => patch({ socialCardInput: e.target.value })}
          />
          {maskedPreview ? (
            <span className="pos-card-fields__preview">
              {t('pos.socialCardPreview', {
                masked: maskedPreview,
                defaultValue: `В чеке: ${maskedPreview}`,
              })}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="pos-card-fields__group">
        <label className="pos-card-fields__label" htmlFor={rrnInputId}>
          {t('pos.cardRrnLabel', { defaultValue: 'RRN (код транзакции с терминала)' })}
        </label>
        <input
          id={rrnInputId}
          type="text"
          inputMode="text"
          autoComplete="off"
          data-autofocus={autoFocusRrn ? 'true' : undefined}
          disabled={disabled}
          className={`pos-card-fields__input${
            error?.field === 'rrn' ? ' pos-card-fields__input--error' : ''
          }`}
          placeholder={t('pos.cardRrnPlaceholder', { defaultValue: 'Например, 631810177451' })}
          value={value?.rrn || ''}
          onChange={(e) => patch({ rrn: e.target.value })}
        />
        <span className="pos-card-fields__hint">
          {t('pos.cardRrnHint', { defaultValue: '12-значный номер RRN со слип-чека терминала' })}
        </span>
      </div>

      {error?.error ? (
        <p className="pos-card-fields__error" role="alert">
          {error.error}
        </p>
      ) : null}
    </div>
  );
}
