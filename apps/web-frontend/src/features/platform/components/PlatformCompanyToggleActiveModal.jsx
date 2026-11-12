import React from 'react';
import Alert from '../../../components/aa/Alert';
import Modal from '../../../components/aa/Modal';

/**
 * PlatformCompanyToggleActiveModal — Kompaniyani faolsizlantirish yoki faollashtirish modali.
 * aa Modal (eni 480px), Alert warning/info va aniq fe’l tugmalari.
 */
export default function PlatformCompanyToggleActiveModal({
  open = false,
  company = null,
  onClose,
  onConfirm,
  isToggling = false,
}) {
  if (!open || !company) return null;

  const isDeactivating = Boolean(company.active);
  const storeCount = company.storeCount ?? 0;

  const title = isDeactivating
    ? 'Kompaniyani faolsizlantirish'
    : 'Kompaniyani faollashtirish';

  const confirmLabel = isDeactivating ? 'Faolsizlantirish' : 'Faollashtirish';

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="!w-full !max-w-[480px]"
      title={title}
      danger={isDeactivating}
      secondaryAction={{
        label: 'Bekor qilish',
        onClick: onClose,
        disabled: isToggling,
      }}
      primaryAction={{
        label: confirmLabel,
        onClick: () => onConfirm?.(company),
        loading: isToggling,
      }}
    >
      <div className="space-y-4">
        {/* Birinchi qator: kompaniya nomi va ID/kirish kodi */}
        <p className="text-sm">
          <strong className="font-semibold text-aa-ink">{company.name}</strong>
          <span className="text-aa-ink-muted">
            {' · '}
            ID <span className="font-mono">{company.id}</span>
            {' · '}
            kirish kodi <span className="font-mono">{company.loginCode || '—'}</span>
          </span>
        </p>

        {isDeactivating ? (
          <Alert tone="warning" title="Filiallar va kassalar to‘xtaydi">
            Kompaniyaning barcha filiallari ({storeCount} ta filial) va kassalari ishlashdan to‘xtaydi. Keyin «Faollashtirish» orqali qayta yoqish mumkin.
          </Alert>
        ) : (
          <Alert tone="info" title="Kompaniyani faollashtirish">
            Kompaniya faol holatga o‘tgach, kassalar va filiallar tizimga qayta ulanadi.
          </Alert>
        )}
      </div>
    </Modal>
  );
}
