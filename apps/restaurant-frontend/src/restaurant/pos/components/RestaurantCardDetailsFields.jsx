import { CARD_CATEGORY } from '@aurent/shared-types';
import { maskSocialCardNumber, normalizeCardCategory } from '@aurent/shared-fiscal';

const CARD_CATEGORIES = [
  { id: CARD_CATEGORY.PERSONAL, labelKey: 'pos.cardPersonal', fallback: 'Личная' },
  { id: CARD_CATEGORY.CORPORATE, labelKey: 'pos.cardCorporate', fallback: 'Корпоративная' },
  { id: CARD_CATEGORY.SOCIAL, labelKey: 'pos.cardSocial', fallback: 'Социальная' },
];

export default function RestaurantCardDetailsFields({
  cardCategory,
  rrn,
  socialCardInput,
  onChange,
  disabled = false,
  t,
}) {
  const category = normalizeCardCategory(cardCategory) || CARD_CATEGORY.PERSONAL;
  const isSocial = category === CARD_CATEGORY.SOCIAL;
  const maskedPreview = isSocial ? maskSocialCardNumber(socialCardInput) : null;

  return (
    <div className="rst-pay-modal__card-extra">
      <div className="rst-pay-modal__field">
        <span>{t('pos.cardCategoryLabel', { defaultValue: 'Тип карты' })}</span>
        <div
          className="rst-pay-modal__card-cats"
          role="radiogroup"
          aria-label={t('pos.cardCategoryLabel', { defaultValue: 'Тип карты' })}
        >
          {CARD_CATEGORIES.map((opt) => {
            const active = category === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                className={`rst-pay-modal__card-cat${active ? ' is-active' : ''}`}
                onClick={() =>
                  onChange?.({
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
        <label className="rst-pay-modal__field">
          <span>{t('pos.socialCardLabel', { defaultValue: 'Номер социальной карты' })}</span>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            value={socialCardInput || ''}
            onChange={(e) => onChange?.({ socialCardInput: e.target.value })}
            placeholder={t('pos.socialCardPlaceholder', {
              defaultValue: '16 цифр или маска со слип-чека (напр. 986003******8031)',
            })}
            disabled={disabled}
          />
          {maskedPreview ? (
            <span className="rst-pay-modal__card-preview">
              {t('pos.socialCardPreview', {
                masked: maskedPreview,
                defaultValue: `В чеке: ${maskedPreview}`,
              })}
            </span>
          ) : null}
        </label>
      ) : null}

      <label className="rst-pay-modal__field">
        <span>{t('pos.cardRrnLabel', { defaultValue: 'RRN (код транзакции с терминала)' })}</span>
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          value={rrn || ''}
          onChange={(e) => onChange?.({ rrn: e.target.value })}
          placeholder={t('pos.cardRrnPlaceholder', { defaultValue: 'Например, 631810177451' })}
          disabled={disabled}
        />
        <span className="rst-pay-modal__card-hint">
          {t('pos.cardRrnHint', { defaultValue: '12-значный номер RRN со слип-чека терминала' })}
        </span>
      </label>
    </div>
  );
}
