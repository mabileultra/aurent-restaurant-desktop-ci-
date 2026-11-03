import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { companyApi } from '../../../api/company.api';
import { companyBusinessTypeApi } from '../../../api/companyBusinessType.api';
import { buildCompanyPayload } from '../utils/companyFormUtils';
import { removeStoredCompanyDraft } from '../utils/companyFormDraftUtils';
import { formatApiErrorMessage } from '../../../utils/apiErrorParser';

export function useCompanyFormMutations({ t, form, editing, constructorTypes, onSaveSuccess, onDeleteSuccess }) {
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error(t('platform.nameRequired'));
      if (form.tin?.trim() && !/^\d{9}$/.test(form.tin.trim())) {
        throw new Error(t('platform.tinMustBe9Digits', { defaultValue: 'STIR 9 ta raqamdan iborat bo‘lishi kerak' }));
      }
      const payload = buildCompanyPayload(form, constructorTypes);
      const { businessTypeIds = [], defaultBusinessTypeId } = form;

      let companyId = editing?.id;
      if (editing?.id) {
        await companyApi.update(editing.id, payload);
      } else {
        const res = await companyApi.create(payload);
        companyId = res.data?.id;
      }

      if (companyId && businessTypeIds.length > 0) {
        try {
          await companyBusinessTypeApi.setForCompany(companyId, {
            businessTypeIds,
            defaultBusinessTypeId: defaultBusinessTypeId ?? businessTypeIds[0],
          });
        } catch (btErr) {
          toast.error(formatApiErrorMessage(btErr, 'Faoliyat turini biriktirishda xatolik yuz berdi'));
        }
      }

      const defaultType = constructorTypes.find((bt) => bt.id === defaultBusinessTypeId);
      if (!editing?.id && companyId && payload.businessType !== (defaultType?.code ?? form.businessType)) {
        await companyApi.update(companyId, { businessType: payload.businessType });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['platform-companies-all'] });
      qc.invalidateQueries({ queryKey: ['company-direct'] });
      qc.invalidateQueries({ queryKey: ['platform-stores-total-count'] });
      qc.invalidateQueries({ queryKey: ['company-business-types'] });
      removeStoredCompanyDraft();
      toast.success(t('platform.companySaved'));
      onSaveSuccess?.();
    },
    onError: (e) => toast.error(formatApiErrorMessage(e, t('platform.saveFailed'))),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => companyApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['platform-companies-all'] });
      qc.invalidateQueries({ queryKey: ['platform-stores-total-count'] });
      toast.success(t('platform.companyDeleted'));
      onDeleteSuccess?.();
    },
    onError: (e) => toast.error(formatApiErrorMessage(e, t('platform.saveFailed'))),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (comp) => {
      const nextActive = !comp.active;
      await companyApi.update(comp.id, { active: nextActive });
      return { id: comp.id, active: nextActive };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['platform-companies-all'] });
      qc.invalidateQueries({ queryKey: ['company-direct'] });
      toast.success(
        data.active
          ? t('platform.companyActivated', { defaultValue: 'Kompaniya faollashtirildi' })
          : t('platform.companyDeactivated', { defaultValue: 'Kompaniya faolsizlantirildi' })
      );
    },
    onError: (e) => toast.error(formatApiErrorMessage(e, 'Holatni o‘zgartirishda xatolik')),
  });

  return {
    saveMutation,
    deleteMutation,
    toggleActiveMutation,
  };
}
