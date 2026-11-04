import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { supplierApi } from '../../../../api';
import { formatUzPhone, isCompleteUzPhone } from '../../../../utils/phoneUz';
import { BaseButton } from '../../../../components/ui';
import '../../styles/supplier-modal.css';
import { toastApiError } from '../../../../utils/apiError';

export default function SupplierModal({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+998 ');

  useEffect(() => {
    if (!open) return;
    setName('');
    setTaxId('');
    setAddress('');
    setEmail('');
    setPhone('+998 ');
  }, [open]);

  const mutation = useMutation({
    mutationFn: (body) => supplierApi.create(body),
    onSuccess: (res) => {
      toast.success(t('suppliersModule.createdOk'));
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      qc.invalidateQueries({ queryKey: ['suppliers-all'] });
      onCreated?.(res?.data ?? res);
      onClose();
    },
    onError: (err) => {
      toastApiError(err, t('suppliersModule.createdFail'));
    },
  });

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !taxId.trim()) {
      toast.error(t('validation.required'));
      return;
    }
    mutation.mutate({
      name: name.trim(),
      taxId: taxId.trim(),
      address: address.trim() || null,
      email: email.trim() || null,
      phone: isCompleteUzPhone(phone) ? formatUzPhone(phone).trim() : null,
    });
  };

  return (
    <div className="rst-supplier-modal">
      <button type="button" className="rst-supplier-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className="rst-supplier-modal__panel" role="dialog" aria-modal="true">
        <div className="rst-supplier-modal__head">
          <h2>{t('suppliersModule.modal.title')}</h2>
          <button type="button" className="rst-supplier-modal__close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <form className="rst-supplier-modal__form" onSubmit={submit}>
          <label className="rst-supplier-modal__field">
            <span>* {t('suppliersModule.modal.name')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="rst-supplier-modal__field">
            <span>* {t('suppliersModule.modal.taxId')}</span>
            <input value={taxId} onChange={(e) => setTaxId(e.target.value)} required />
          </label>
          <label className="rst-supplier-modal__field">
            <span>{t('suppliersModule.modal.address')}</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <label className="rst-supplier-modal__field">
            <span>{t('suppliersModule.modal.email')}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="rst-supplier-modal__field">
            <span>{t('suppliersModule.modal.phone')}</span>
            <input
              value={phone}
              onChange={(e) => setPhone(formatUzPhone(e.target.value))}
              placeholder="+998 (__) ___-__-__"
            />
          </label>
          <div className="rst-supplier-modal__actions">
            <BaseButton type="button" variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </BaseButton>
            <BaseButton type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.processing') : t('suppliersModule.add')}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}
