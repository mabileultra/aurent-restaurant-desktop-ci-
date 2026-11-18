import { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { platformBusinessTypeApi, platformReferenceBookApi } from '../../../api';
import { mergeFormFieldsState } from '../utils/businessTypeUtils';
import { usePlatformBusinessTypeRules } from './usePlatformBusinessTypeRules';
import { usePlatformBusinessTypeModals } from './usePlatformBusinessTypeModals';

export function usePlatformBusinessTypesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['platform-business-types'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data),
  });

  const { data: catalogUnits = [] } = useQuery({
    queryKey: ['platform-catalog-units'],
    queryFn: () => platformBusinessTypeApi.listCatalogUnits().then((r) => r.data),
    staleTime: 300_000,
  });

  const { data: referenceBooks = [] } = useQuery({
    queryKey: ['platform-reference-books'],
    queryFn: () => platformReferenceBookApi.list().then((r) => r.data),
    staleTime: 300_000,
  });

  const activeTypeId = selectedId ?? types[0]?.id ?? null;

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['platform-business-type', activeTypeId],
    queryFn: () => platformBusinessTypeApi.get(activeTypeId).then((r) => r.data),
    enabled: !!activeTypeId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['platform-business-types'] });
    if (activeTypeId) qc.invalidateQueries({ queryKey: ['platform-business-type', activeTypeId] });
    qc.invalidateQueries({ queryKey: ['business-config'] });
  };

  const fields = useMemo(
    () => [...(detail?.fields ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [detail?.fields]
  );

  const rules = usePlatformBusinessTypeRules({
    activeTypeId,
    fields,
    invalidate,
    t,
  });

  const modals = usePlatformBusinessTypeModals({
    activeTypeId,
    detail,
    setSelectedId,
    invalidate,
    t,
  });

  useEffect(() => {
    if (!detail) return;
    const codes = detail.units?.map((u) => u.unitCode) ?? [];
    rules.setUnitCodes(codes);
    rules.setDefaultUnitCode(detail.units?.find((u) => u.defaultUnit)?.unitCode ?? codes[0] ?? 'PCS');
    rules.setRules(detail.rules ?? []);
    rules.setFormFields(mergeFormFieldsState(detail.formFields));
    rules.setPriceRules(detail.priceRules ?? []);
    rules.setDisplayRules(detail.displayRules ?? []);
  }, [detail]);

  return {
    t,
    types,
    isLoading,
    activeTypeId,
    setSelectedId,
    detail,
    detailLoading,
    fields,
    catalogUnits,
    referenceBooks,
    unitCodes: rules.unitCodes,
    defaultUnitCode: rules.defaultUnitCode,
    rules: rules.rules,
    formFields: rules.formFields,
    priceRules: rules.priceRules,
    displayRules: rules.displayRules,
    typeModal: modals.typeModal,
    openCreateType: modals.openCreateType,
    openEditType: modals.openEditType,
    closeTypeModal: modals.closeTypeModal,
    updateTypeForm: modals.updateTypeForm,
    saveType: modals.saveType,
    tryDeleteType: modals.tryDeleteType,
    saveTypeMutation: modals.saveTypeMutation,
    fieldModal: modals.fieldModal,
    fieldForm: modals.fieldForm,
    openCreateField: modals.openCreateField,
    openFieldEdit: modals.openFieldEdit,
    closeFieldModal: modals.closeFieldModal,
    updateFieldForm: modals.updateFieldForm,
    submitField: modals.submitField,
    tryDeleteField: modals.tryDeleteField,
    saveFieldMutation: modals.saveFieldMutation,
    toggleUnit: rules.toggleUnit,
    setDefaultUnit: rules.setDefaultUnit,
    toggleRule: rules.toggleRule,
    toggleFormField: rules.toggleFormField,
    setFormFieldGroup: rules.setFormFieldGroup,
    changePriceRule: rules.changePriceRule,
    addDisplayRule: rules.addDisplayRule,
    changeDisplayRule: rules.changeDisplayRule,
    removeDisplayRule: rules.removeDisplayRule,
    saveUnitsMutation: rules.saveUnitsMutation,
    saveRulesMutation: rules.saveRulesMutation,
    saveFormFieldsMutation: rules.saveFormFieldsMutation,
    savePriceRulesMutation: rules.savePriceRulesMutation,
    saveDisplayRulesMutation: rules.saveDisplayRulesMutation,
  };
}
