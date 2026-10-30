import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supplierApi } from '../../../../../../api';
import { BaseButton } from '../../../../../../components/ui';
import { formatUzPhone, isCompleteUzPhone } from '../../../../../../utils/phoneUz';
import './product-import-quick-supplier.css';

/**
 * Всплывающая форма как в справочнике: название, ИНН, адрес, email, телефон.
 */
export default function ProductImportQuickSupplier({ t, onCreated }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const rootRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setName('');
      setTaxId('');
      setAddress('');
      setEmail('');
      setPhone('+998 ');
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [open]);

  const createM = useMutation({
    mutationFn: (body) => supplierApi.create(body).then((r) => r.data),
    onSuccess: (created) => {
      toast.success(t('suppliersModule.createdOk'));
      qc.invalidateQueries({ queryKey: ['suppliers-all'] });
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      const id = created?.id != null ? String(created.id) : '';
      if (id) onCreated?.(id);
      setOpen(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('suppliersModule.createdFail'));
    },
  });

  const submit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim() || !taxId.trim()) {
      toast.error(t('validation.required'));
      return;
    }
    createM.mutate({
      name: name.trim(),
      taxId: taxId.trim(),
      address: address.trim() || null,
      email: email.trim() || null,
      phone: isCompleteUzPhone(phone) ? formatUzPhone(phone).trim() : null,
    });
  };

  return (
    <div className="product-import-quick-supplier" ref={rootRef}>
      <button
        type="button"
        className="product-import-quick-supplier__plus"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={t('products.import.addSupplierQuick')}
        aria-label={t('products.import.addSupplierQuick')}
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
      {open ? (
        <form className="product-import-quick-supplier__pop" onSubmit={submit}>
          <div className="product-import-quick-supplier__head">
            <span>{t('suppliersModule.modal.title')}</span>
            <button
              type="button"
              className="product-import-quick-supplier__close"
              onClick={() => setOpen(false)}
              aria-label={t('common.close')}
            >
              <X size={16} />
            </button>
          </div>
          <label className="product-import-quick-supplier__field">
            <span>
              <em>*</em>
              {' '}
              {t('suppliersModule.modal.name')}
            </span>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="product-import-quick-supplier__field">
            <span>
              <em>*</em>
              {' '}
              {t('suppliersModule.modal.taxId')}
            </span>
            <input
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="product-import-quick-supplier__field">
            <span>{t('suppliersModule.modal.address')}</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="product-import-quick-supplier__field">
            <span>{t('suppliersModule.modal.email')}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="product-import-quick-supplier__field">
            <span>{t('suppliersModule.modal.phone')}</span>
            <input
              value={phone}
              onChange={(e) => setPhone(formatUzPhone(e.target.value))}
              placeholder="+998 (__) ___-__-__"
              autoComplete="off"
            />
          </label>
          <div className="product-import-quick-supplier__actions">
            <BaseButton type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </BaseButton>
            <BaseButton type="submit" variant="primary" size="sm" disabled={createM.isPending}>
              {createM.isPending ? '…' : t('suppliersModule.add')}
            </BaseButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}
