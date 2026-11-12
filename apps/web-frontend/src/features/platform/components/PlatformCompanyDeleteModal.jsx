import React from 'react';
import { Trash2 } from 'lucide-react';
import Alert from '../../../components/aa/Alert';
import Button from '../../../components/aa/Button';
import Modal from '../../../components/aa/Modal';

/**
 * PlatformCompanyDeleteModal — Kompaniyani o‘chirish modali.
 * aa Modal (eni 480px).
 * Filiali bo‘lsa: «Kompaniyani o‘chirib bo‘lmaydi» (Alert warning, Faolsizlantirish tugmasi).
 * Filiali bo‘lmasa: «Kompaniyani o‘chirish» (Alert danger, O‘chirish tugmasi).
 */
export default function PlatformCompanyDeleteModal({
  open = false,
  company = null,
  onClose,
  onConfirmDelete,
  onToggleActive,
  isDeleting = false,
}) {
  if (!open || !company) return null;

  const storeCount = company.storeCount ?? 0;
  const hasStores = storeCount > 0;

  const title = hasStores
    ? 'Kompaniyani o‘chirib bo‘lmaydi'
    : 'Kompaniyani o‘chirish';

  const handleDeactivate = () => {
    onClose?.();
    onToggleActive?.(company);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="!w-full !max-w-[480px]"
      title={title}
      danger={!hasStores}
      secondaryAction={{
        label: 'Bekor qilish',
        onClick: onClose,
        disabled: isDeleting,
      }}
      primaryAction={
        hasStores ? (
          <Button
            variant="danger"
            onClick={handleDeactivate}
            disabled={isDeleting}
          >
            Faolsizlantirish
          </Button>
        ) : (
          <Button
            variant="danger"
            icon={<Trash2 size={16} aria-hidden="true" />}
            onClick={() => onConfirmDelete?.(company)}
            loading={isDeleting}
          >
            O‘chirish
          </Button>
        )
      }
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

        {hasStores ? (
          <Alert tone="warning" title={`Kompaniyaga ${storeCount} ta filial biriktirilgan`}>
            Filiali bor kompaniyani o‘chirib bo‘lmaydi. Uning o‘rniga kompaniyani faolsizlantiring — ma’lumotlari saqlanib qoladi.
          </Alert>
        ) : (
          <Alert tone="danger" title="Bu amalni qaytarib bo‘lmaydi">
            Kompaniya va uning sozlamalari butunlay o‘chiriladi.
          </Alert>
        )}
      </div>
    </Modal>
  );
}
