import { BaseButton, BaseInput } from '../../../components/ui';
import RstOverlay from '../../shared/components/RstOverlay';
import '../../shared/styles/rst-modal.css';

const emptyForm = () => ({
  clientName: '',
  clientPhone: '',
  deliveryAddress: '',
  comment: '',
});

export default function OpenCounterOrderModal({
  open,
  channel,
  form,
  onChange,
  onClose,
  onSubmit,
  isPending,
  t,
}) {
  if (!open) return null;
  const isDelivery = channel === 'DELIVERY';
  const value = form ?? emptyForm();

  return (
    <RstOverlay onClose={onClose}>
      <div className="rst-modal__card rst-modal__card--wide">
        <h2 className="rst-modal__title">
          {isDelivery ? t('rst.pos.newDelivery') : t('rst.pos.newTakeaway')}
        </h2>
        <p className="rst-modal__text">
          {isDelivery ? t('rst.pos.deliveryFormHint') : t('rst.pos.takeawayFormHint')}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {isDelivery ? (
            <>
              <label className="d-block mb-3">
                <span className="d-block mb-1 small">{t('rst.pos.clientName')}</span>
                <BaseInput
                  value={value.clientName}
                  onChange={(e) => onChange({ ...value, clientName: e.target.value })}
                  required
                  autoFocus
                />
              </label>
              <label className="d-block mb-3">
                <span className="d-block mb-1 small">{t('rst.pos.clientPhone')}</span>
                <BaseInput
                  value={value.clientPhone}
                  onChange={(e) => onChange({ ...value, clientPhone: e.target.value })}
                  required
                />
              </label>
              <label className="d-block mb-3">
                <span className="d-block mb-1 small">{t('rst.pos.deliveryAddress')}</span>
                <BaseInput
                  value={value.deliveryAddress}
                  onChange={(e) => onChange({ ...value, deliveryAddress: e.target.value })}
                  required
                />
              </label>
            </>
          ) : (
            <label className="d-block mb-3">
              <span className="d-block mb-1 small">{t('rst.pos.clientNameOptional')}</span>
              <BaseInput
                value={value.clientName}
                onChange={(e) => onChange({ ...value, clientName: e.target.value })}
                placeholder={t('rst.pos.clientNamePh')}
                autoFocus
              />
            </label>
          )}
          <label className="d-block mb-3">
            <span className="d-block mb-1 small">{t('rst.pos.comment')}</span>
            <BaseInput
              value={value.comment}
              onChange={(e) => onChange({ ...value, comment: e.target.value })}
              placeholder={t('rst.pos.commentPh')}
            />
          </label>
          <div className="rst-modal__actions">
            <BaseButton type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</BaseButton>
            <BaseButton type="submit" disabled={isPending}>
              {t('rst.pos.openOrder')}
            </BaseButton>
          </div>
        </form>
      </div>
    </RstOverlay>
  );
}
