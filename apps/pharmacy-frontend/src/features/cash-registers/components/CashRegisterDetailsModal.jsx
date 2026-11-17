// src/components/cash-registers/CashRegisterDetailsModal.jsx
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { X, Tag, CreditCard, Play, Pause, Pencil, MapPin, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cashRegisterApi } from '../../../services/api';
import '../../../styles/cash-registers/details.css';

function fmtDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'yyyy-MM-dd, HH:mm');
  } catch {
    return '—';
  }
}

function DetailRow({ icon: Icon, label, value, valueClassName = '' }) {
  return (
    <div className="cr-details-modal__row">
      <span className="cr-details-modal__label">
        {Icon ? <Icon size={16} className="shrink-0 opacity-70" aria-hidden /> : null}
        {label}
      </span>
      <span className={`cr-details-modal__value ${valueClassName}`}>{value ?? '—'}</span>
    </div>
  );
}

export default function CashRegisterDetailsModal({ registerId, onClose, onEdit, onMultikassa, onFiscalDrive }) {
  const { t } = useTranslation();

  const { data, isPending, isError } = useQuery({
    queryKey: ['cash-register-detail', registerId],
    queryFn: () => cashRegisterApi.getById(registerId).then((r) => r.data),
    enabled: Boolean(registerId),
  });

  if (!registerId) return null;

  const isActive = data?.status === 'ACTIVE';

  return (
    <div className="ui-modal-overlay z-[70]">
      <button type="button" className="fixed inset-0 bg-ink/45" aria-label="Close" onClick={onClose} />
      <div
        className="cr-details-modal ui-modal-panel relative max-h-[90vh]"
        role="dialog"
        aria-labelledby="cr-details-title"
      >
        <div className="ui-modal-header">
          <h2 id="cr-details-title" className="text-base font-semibold text-ink">
            {t('cashRegisters.detailsTitle')}
          </h2>
          <button type="button" onClick={onClose} className="ui-icon-btn" aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto">
          {isPending ? (
            <p className="px-5 py-10 text-center text-sm text-ink-muted">{t('common.loading')}</p>
          ) : isError ? (
            <p className="px-5 py-10 text-center text-sm text-danger-text">{t('cashRegisters.detailsLoadError')}</p>
          ) : (
            <>
              <section className="cr-details-modal__section">
                <div className="cr-details-modal__grid">
                  <DetailRow icon={Tag} label={t('cashRegisters.detailsModel')} value={data.equipmentModel} />
                  <DetailRow icon={Tag} label={t('cashRegisters.detailsSerial')} value={data.equipmentSerial} />
                  <DetailRow icon={CreditCard} label={t('cashRegisters.detailsFiscal')} value={data.fiscalCardId} />
                  <DetailRow label={t('cashRegisters.formDeviceId')} value={data.deviceId} />
                  <DetailRow label={t('cashRegisters.formWorkstation')} value={data.workstationName} />
                  <DetailRow
                    icon={Calendar}
                    label={t('cashRegisters.detailsLastSeen')}
                    value={fmtDateTime(data.lastSeenAt)}
                  />
                  <div className="cr-details-modal__row">
                    <span className="cr-details-modal__label">{t('cashRegisters.detailsStatus')}</span>
                    <span className="cr-details-modal__value">
                      {isActive ? (
                        <span className="cr-details-modal__status-active" title={t('cashRegisters.statusActive')}>
                          <Play size={18} strokeWidth={2.5} />
                        </span>
                      ) : (
                        <Pause size={18} className="text-ink-disabled" aria-hidden />
                      )}
                    </span>
                  </div>
                </div>
              </section>

              <section className="cr-details-modal__section">
                <div className="space-y-4">
                  <DetailRow icon={Pencil} label={t('cashRegisters.detailsStoreName')} value={data.storeName} />
                  <DetailRow label={t('cashRegisters.detailsRegisterNo')} value={data.registerNumber} />
                  <DetailRow
                    icon={MapPin}
                    label={t('cashRegisters.detailsStoreAddress')}
                    value={data.storeAddress}
                    valueClassName="cr-details-modal__value--address"
                  />
                </div>
              </section>

              <section className="cr-details-modal__section">
                <div className="cr-details-modal__grid">
                  <DetailRow
                    icon={Calendar}
                    label={t('cashRegisters.detailsCreatedAt')}
                    value={fmtDateTime(data.createdAt)}
                  />
                  <DetailRow
                    icon={Calendar}
                    label={t('cashRegisters.detailsUpdatedAt')}
                    value={fmtDateTime(data.updatedAt)}
                  />
                </div>
              </section>
            </>
          )}
        </div>

        <footer className="cr-details-modal__footer">
          {onMultikassa && data ? (
            <button
              type="button"
              onClick={() => onMultikassa(data.id)}
              className="ui-btn-secondary"
            >
              {t('cashRegisters.multikassa.openSettings')}
            </button>
          ) : null}
          {onFiscalDrive && data ? (
            <button
              type="button"
              onClick={() => onFiscalDrive(data.id)}
              className="ui-btn-secondary"
            >
              {t('cashRegisters.fiscalDrive.openSettings')}
            </button>
          ) : null}
          {onEdit && data ? (
            <button
              type="button"
              onClick={() => onEdit(data.id)}
              className="ui-btn-secondary"
            >
              {t('common.edit')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="ui-btn-secondary"
          >
            {t('common.close')}
          </button>
        </footer>
      </div>
    </div>
  );
}
