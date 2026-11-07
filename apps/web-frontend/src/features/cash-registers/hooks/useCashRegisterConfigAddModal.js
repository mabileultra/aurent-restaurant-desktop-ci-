import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cashRegisterConfigApi } from '../../../services/api';

export function useCashRegisterConfigAddModal({ open, onClose, onSaved }) {
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
    const cid = Number(pickCategoryId);
    setCategoryIds((prev) => new Set(prev).add(cid));
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
        registerIds: [...registerIds],
        categoryIds: [...categoryIds],
      });
      toast.success(t('cashRegisters.configModalCreated'));
      onSaved?.();
      onClose();
    } catch {
      toast.error(t('cashRegisters.configModalCreateError'));
    }
  };

  return {
    t,
    register,
    handleSubmit,
    onSubmit,
    errors,
    isPending,
    isError,
    stores,
    storeIds,
    toggleStore,
    visibleRegisters,
    registerIds,
    toggleRegister,
    categories,
    categoryIds,
    setCategoryIds,
    pickCategoryId,
    setPickCategoryId,
    availableCategories,
    selectedCategories,
    addPickedCategory,
    removeCategory,
  };
}
