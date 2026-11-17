// src/components/cash-registers/CashRegisterConfigAddModal.jsx
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BaseSelect } from '../../../components/ui';
import { cashRegisterConfigApi } from '../../../services/api';
import '../../../styles/cash-registers/config.css';

const inputCls = 'ui-input';

export default function CashRegisterConfigAddModal({ open, onClose, onSaved }) {
  const { t } = useTranslation();
  const [storeIds, setStoreIds] = useState(() => new Set());
  const [registerIds, setRegisterIds] = useState(() => new Set());
  const [categoryIds, setCategoryIds] = useState(() => new Set());
  const [pickCategoryId, setPickCategoryId] = useState('');

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t('cashRegisters.configNameRequired')),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  const { data: formOptions, isPending, isError } = useQuery({
    queryKey: ['cash-register-config-form-options'],
    queryFn: () => cashRegisterConfigApi.getFormOptions().then((r) => r.data),
    enabled: open,
  });

  const stores = formOptions?.stores ?? [];
  const allRegisters = formOptions?.registers ?? [];
  const categories = formOptions?.categories ?? [];

  const visibleRegisters = useMemo(() => {
    if (storeIds.size === 0) return allRegisters;
    return allRegisters.filter((r) => storeIds.has(r.storeId));
  }, [allRegisters, storeIds]);

  useEffect(() => {
    if (!open) return;
    reset({ name: '' });
    setStoreIds(new Set());
    setRegisterIds(new Set());
    setCategoryIds(new Set());
    setPickCategoryId('');
  }, [open, reset]);

  useEffect(() => {
    if (storeIds.size === 0) return;
    setRegisterIds((prev) => {
      const allowed = new Set(visibleRegisters.map((r) => r.id));
      const next = new Set([...prev].filter((id) => allowed.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [storeIds, visibleRegisters]);

  const availableCategories = useMemo(
    () => categories.filter((c) => !categoryIds.has(c.id)),
    [categories, categoryIds]
  );

  const selectedCategories = useMemo(
    () => categories.filter((c) => categoryIds.has(c.id)),
    [categories, categoryIds]
  );

  const toggleStore = (id) => {
    setStoreIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleRegister = (id) => {
    setRegisterIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const addPickedCategory = () => {
    if (!pickCategoryId) return;
    const id = Number(pickCategoryId);
    if (!Number.isFinite(id)) return;
    setCategoryIds((prev) => new Set(prev).add(id));
    setPickCategoryId('');
  };

  const removeCategory = (id) => {
    setCategoryIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const onSubmit = async (values) => {
    try {
      await cashRegisterConfigApi.create({
        name: values.name.trim(),
        storeIds: [...storeIds],
        cashRegisterIds: [...registerIds],
        categoryIds: [...categoryIds],
      });
      toast.success(t('cashRegisters.configCreated'));
      onSaved();
      onClose();
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? t('cashRegisters.configCreateFailed');
      toast.error(msg);
    }
  };

  if (!open) return null;

  return (
    <div className="ui-modal-overlay z-[60]">
      <button type="button" className="fixed inset-0 bg-ink/45" aria-label="Close" onClick={onClose} />
      <div className="ui-modal-panel relative max-w-lg max-h-[90vh]">
        <div className="ui-modal-header">
          <h2 className="text-base font-semibold text-ink">{t('cashRegisters.configModalTitle')}</h2>
          <button type="button" onClick={onClose} className="ui-icon-btn" aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="ui-modal-body flex-1 space-y-4 overflow-y-auto">
            {isError && (
              <p className="ui-alert-danger">
                {t('cashRegisters.configCreateFailed')}
              </p>
            )}

            {isPending ? (
              <p className="text-sm text-ink-muted">{t('common.loading')}</p>
            ) : (
              <>
                <div>
                  <label className="ui-label mb-1">
                    * {t('cashRegisters.configNameLabel')}
                  </label>
                  <input {...register('name')} className={`${inputCls} ${errors.name ? 'ui-input-error' : ''}`} />
                  {errors.name && <p className="mt-1 text-xs text-danger-text">{errors.name.message}</p>}
                </div>

                <div>
                  <div className="ui-label mb-2">
                    {t('cashRegisters.configStoresLabel')}
                  </div>
                  <div className="crc-modal__pick-list">
                    {stores.length === 0 ? (
                      <p className="crc-modal__empty">{t('cashRegisters.configEmptyStores')}</p>
                    ) : (
                      stores.map((s) => (
                        <label key={s.id} className="crc-modal__pick-row">
                          <input type="checkbox" checked={storeIds.has(s.id)} onChange={() => toggleStore(s.id)} />
                          <span>{s.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="ui-label mb-2">
                    {t('cashRegisters.configRegistersLabel')}
                  </div>
                  <div className="crc-modal__pick-list">
                    {visibleRegisters.length === 0 ? (
                      <p className="crc-modal__empty">
                        {storeIds.size > 0
                          ? t('cashRegisters.configEmptyRegisters')
                          : t('cashRegisters.configEmptyRegisters')}
                      </p>
                    ) : (
                      visibleRegisters.map((r) => (
                        <label key={r.id} className="crc-modal__pick-row">
                          <input type="checkbox" checked={registerIds.has(r.id)} onChange={() => toggleRegister(r.id)} />
                          <span className="break-all">
                            {r.storeName} · №{r.registerNumber}
                            {r.equipmentSerial ? ` · ${r.equipmentSerial}` : ''}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="ui-label mb-2">
                    {t('cashRegisters.configCategoriesLabel')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <BaseSelect
                      className="min-w-0 flex-1"
                      value={pickCategoryId}
                      onChange={(e) => setPickCategoryId(e.target.value)}
                      disabled={availableCategories.length === 0}
                      placeholder={t('cashRegisters.configSelectCategory')}
                      options={[
                        { value: '', label: t('cashRegisters.configSelectCategory') },
                        ...availableCategories.map((c) => ({
                          value: String(c.id),
                          label: c.name,
                        })),
                      ]}
                    />
                    <button
                      type="button"
                      onClick={addPickedCategory}
                      disabled={!pickCategoryId}
                      className="ui-btn-secondary"
                    >
                      {t('cashRegisters.configAddCategory')}
                    </button>
                  </div>

                  <div className="crc-modal__categories-grid">
                    <div className="crc-modal__category-panel">
                      <div className="crc-modal__category-panel-title">
                        {t('cashRegisters.configAvailableCategories')}
                      </div>
                      <div className="crc-modal__category-panel-body">
                        {categories.length === 0 ? (
                          <p className="crc-modal__empty">{t('cashRegisters.configEmptyCategories')}</p>
                        ) : availableCategories.length === 0 ? (
                          <p className="crc-modal__empty">{t('cashRegisters.configNoCategoriesLeft')}</p>
                        ) : (
                          availableCategories.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="crc-modal__category-item crc-modal__category-item--add"
                              onClick={() => setCategoryIds((prev) => new Set(prev).add(c.id))}
                            >
                              <span className="truncate">+ {c.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="crc-modal__category-panel">
                      <div className="crc-modal__category-panel-title">
                        {t('cashRegisters.configSelectedCategories')}
                      </div>
                      <div className="crc-modal__category-panel-body">
                        {selectedCategories.length === 0 ? (
                          <p className="crc-modal__empty">{t('cashRegisters.configPickCategoryHint')}</p>
                        ) : (
                          selectedCategories.map((c) => (
                            <div key={c.id} className="crc-modal__category-item">
                              <span className="truncate">{c.name}</span>
                              <button
                                type="button"
                                className="shrink-0 text-danger-text hover:text-danger"
                                onClick={() => removeCategory(c.id)}
                                aria-label={t('common.delete')}
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="ui-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="ui-btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="ui-btn-primary"
            >
              {t('cashRegisters.configModalAdd')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
