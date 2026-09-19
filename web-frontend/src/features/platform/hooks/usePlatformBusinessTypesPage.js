import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { platformBusinessTypeApi, platformReferenceBookApi } from '../../../api';
import {
  EMPTY_BUSINESS_FIELD_FORM,
  EMPTY_BUSINESS_TYPE_FORM,
  fieldToForm,
  parseOptionsText,
} from '../utils/businessTypeUtils';
import { CATALOG_FORM_FIELD_DEFS } from '../../../config/productCatalogFormFields';

function defaultFormFieldsState() {
  return CATALOG_FORM_FIELD_DEFS.map((def) => ({
    ruleKey: def.ruleKey,
    ruleValue: 'true',
    enabled: true,
  }));
}

export function usePlatformBusinessTypesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [typeModal, setTypeModal] = useState(null);
  const [fieldModal, setFieldModal] = useState(null);
  const [fieldForm, setFieldForm] = useState(EMPTY_BUSINESS_FIELD_FORM);
  const [unitCodes, setUnitCodes] = useState([]);
  const [defaultUnitCode, setDefaultUnitCode] = useState('PCS');
  const [rules, setRules] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [priceRules, setPriceRules] = useState([]);
  const [displayRules, setDisplayRules] = useState([]);

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

  useEffect(() => {
    if (!detail) return;
    const codes = detail.units?.map((u) => u.unitCode) ?? [];
    setUnitCodes(codes);
    setDefaultUnitCode(detail.units?.find((u) => u.defaultUnit)?.unitCode ?? codes[0] ?? 'PCS');
    setRules(detail.rules ?? []);
    setFormFields(detail.formFields?.length ? detail.formFields : defaultFormFieldsState());
    setPriceRules(detail.priceRules ?? []);
    setDisplayRules(detail.displayRules ?? []);
  }, [detail]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['platform-business-types'] });
    if (activeTypeId) qc.invalidateQueries({ queryKey: ['platform-business-type', activeTypeId] });
    qc.invalidateQueries({ queryKey: ['business-config'] });
  };

  const saveTypeMutation = useMutation({
    mutationFn: (payload) =>
      payload.id
        ? platformBusinessTypeApi.update(payload.id, payload.body)
        : platformBusinessTypeApi.create(payload.body),
    onSuccess: (res) => {
      invalidate();
      setSelectedId(res.data.id);
      setTypeModal(null);
      toast.success(t('platform.businessTypes.saved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id) => platformBusinessTypeApi.delete(id),
    onSuccess: () => {
      invalidate();
      setSelectedId(null);
      toast.success(t('platform.businessTypes.deleted'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const saveFieldMutation = useMutation({
    mutationFn: ({ typeId, fieldId, body }) =>
      fieldId
        ? platformBusinessTypeApi.updateField(typeId, fieldId, body)
        : platformBusinessTypeApi.addField(typeId, body),
    onSuccess: () => {
      invalidate();
      setFieldModal(null);
      toast.success(t('platform.businessTypes.fieldSaved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: ({ typeId, fieldId }) => platformBusinessTypeApi.deleteField(typeId, fieldId),
    onSuccess: () => {
      invalidate();
      toast.success(t('platform.businessTypes.fieldDeleted'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const saveUnitsMutation = useMutation({
    mutationFn: () => platformBusinessTypeApi.setUnits(activeTypeId, {
      unitCodes,
      defaultUnitCode,
    }),
    onSuccess: () => {
      invalidate();
      toast.success(t('platform.businessTypes.unitsSaved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const saveRulesMutation = useMutation({
    mutationFn: () => platformBusinessTypeApi.setRules(activeTypeId, {
      rules: rules.map((rule) => ({
        ruleKey: rule.ruleKey,
        ruleValue: rule.enabled ? 'true' : 'false',
      })),
    }),
    onSuccess: () => {
      invalidate();
      toast.success(t('platform.businessTypes.rulesSaved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const saveFormFieldsMutation = useMutation({
    mutationFn: () => platformBusinessTypeApi.setFormFields(activeTypeId, {
      rules: formFields.map((rule) => ({
        ruleKey: rule.ruleKey,
        ruleValue: rule.enabled ? 'true' : 'false',
      })),
    }),
    onSuccess: () => {
      invalidate();
      toast.success(t('platform.businessTypes.formFieldsSaved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const savePriceRulesMutation = useMutation({
    mutationFn: () => platformBusinessTypeApi.setPriceRules(activeTypeId, {
      rules: priceRules.map((rule) => ({
        ruleKey: rule.ruleKey,
        ruleValue: rule.numeric ? String(rule.ruleValue) : (rule.enabled ? 'true' : 'false'),
      })),
    }),
    onSuccess: () => {
      invalidate();
      toast.success(t('platform.businessTypes.priceRulesSaved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const saveDisplayRulesMutation = useMutation({
    mutationFn: () => platformBusinessTypeApi.setDisplayRules(activeTypeId, {
      rules: displayRules.map((rule, index) => ({
        targetFieldKey: rule.targetFieldKey,
        triggerFieldKey: rule.triggerFieldKey,
        operator: rule.operator,
        triggerValue: rule.triggerValue || null,
        effect: rule.effect,
        sortOrder: rule.sortOrder ?? (index + 1) * 10,
      })),
    }),
    onSuccess: () => {
      invalidate();
      toast.success(t('platform.businessTypes.displayRulesSaved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const fields = useMemo(
    () => [...(detail?.fields ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [detail?.fields]
  );

  const openCreateType = () => {
    setTypeModal({ mode: 'create', form: { ...EMPTY_BUSINESS_TYPE_FORM } });
  };

  const openEditType = () => {
    if (!detail) return;
    setTypeModal({
      mode: 'edit',
      id: detail.id,
      form: {
        name: detail.name,
        description: detail.description ?? '',
        active: detail.active,
        sortOrder: detail.sortOrder,
      },
    });
  };

  const closeTypeModal = () => setTypeModal(null);

  const updateTypeForm = (patch) => {
    setTypeModal((prev) => (prev ? { ...prev, form: { ...prev.form, ...patch } } : prev));
  };

  const saveType = () => {
    if (!typeModal) return;
    saveTypeMutation.mutate({ id: typeModal.id, body: typeModal.form });
  };

  const tryDeleteType = () => {
    if (!detail) return;
    if (window.confirm(t('platform.businessTypes.deleteConfirm', { name: detail.name }))) {
      deleteTypeMutation.mutate(detail.id);
    }
  };

  const openCreateField = () => {
    setFieldForm(EMPTY_BUSINESS_FIELD_FORM);
    setFieldModal({ mode: 'create' });
  };

  const openFieldEdit = (field) => {
    setFieldForm(fieldToForm(field));
    setFieldModal({ mode: 'edit', field });
  };

  const closeFieldModal = () => setFieldModal(null);

  const updateFieldForm = (patch) => {
    setFieldForm((prev) => ({ ...prev, ...patch }));
  };

  const submitField = () => {
    const body = {
      label: fieldForm.label.trim(),
      fieldType: fieldForm.fieldType,
      required: fieldForm.required,
      enabled: fieldForm.enabled,
      filterable: fieldForm.filterable,
      sortOrder: Number(fieldForm.sortOrder) || 100,
      placeholder: fieldForm.placeholder.trim() || null,
      hint: fieldForm.hint.trim() || null,
      referenceBookId: fieldForm.referenceBookId ? Number(fieldForm.referenceBookId) : null,
      options: fieldForm.fieldType === 'LIST' && !fieldForm.referenceBookId
        ? parseOptionsText(fieldForm.optionsText)
        : [],
    };
    if (fieldModal?.mode === 'edit') {
      saveFieldMutation.mutate({ typeId: activeTypeId, fieldId: fieldModal.field.id, body });
      return;
    }
    saveFieldMutation.mutate({
      typeId: activeTypeId,
      body: { ...body, fieldKey: fieldForm.fieldKey.trim().toLowerCase() },
    });
  };

  const tryDeleteField = (field) => {
    if (window.confirm(t('platform.businessTypes.deleteFieldConfirm', { name: field.label }))) {
      deleteFieldMutation.mutate({ typeId: activeTypeId, fieldId: field.id });
    }
  };

  const toggleUnit = (code) => {
    setUnitCodes((prev) => {
      const exists = prev.includes(code);
      const next = exists ? prev.filter((c) => c !== code) : [...prev, code];
      if (!next.includes(defaultUnitCode)) {
        setDefaultUnitCode(next[0] ?? 'PCS');
      }
      if (!exists && next.length === 1) {
        setDefaultUnitCode(code);
      }
      return next;
    });
  };

  const setDefaultUnit = (code) => {
    setDefaultUnitCode(code);
  };

  const toggleRule = (ruleKey) => {
    setRules((prev) => prev.map((rule) => (
      rule.ruleKey === ruleKey ? { ...rule, enabled: !rule.enabled } : rule
    )));
  };

  const toggleFormField = (ruleKey) => {
    setFormFields((prev) => {
      const exists = prev.some((rule) => rule.ruleKey === ruleKey);
      if (!exists) {
        return [...prev, { ruleKey, ruleValue: 'false', enabled: false }];
      }
      return prev.map((rule) => (
        rule.ruleKey === ruleKey ? { ...rule, enabled: !rule.enabled } : rule
      ));
    });
  };

  const changePriceRule = (ruleKey, value) => {
    setPriceRules((prev) => prev.map((rule) => {
      if (rule.ruleKey !== ruleKey) return rule;
      if (rule.numeric) return { ...rule, ruleValue: value, enabled: false };
      return { ...rule, enabled: value === 'true', ruleValue: value };
    }));
  };

  const addDisplayRule = () => {
    const first = fields[0]?.fieldKey ?? '';
    const second = fields[1]?.fieldKey ?? first;
    setDisplayRules((prev) => [
      ...prev,
      {
        targetFieldKey: first,
        triggerFieldKey: second,
        operator: 'EQUALS',
        triggerValue: '',
        effect: 'SHOW',
        sortOrder: (prev.length + 1) * 10,
      },
    ]);
  };

  const changeDisplayRule = (index, patch) => {
    setDisplayRules((prev) => prev.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
  };

  const removeDisplayRule = (index) => {
    setDisplayRules((prev) => prev.filter((_, i) => i !== index));
  };

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
    unitCodes,
    defaultUnitCode,
    rules,
    formFields,
    priceRules,
    displayRules,
    typeModal,
    openCreateType,
    openEditType,
    closeTypeModal,
    updateTypeForm,
    saveType,
    tryDeleteType,
    saveTypeMutation,
    fieldModal,
    fieldForm,
    openCreateField,
    openFieldEdit,
    closeFieldModal,
    updateFieldForm,
    submitField,
    tryDeleteField,
    saveFieldMutation,
    toggleUnit,
    setDefaultUnit,
    toggleRule,
    toggleFormField,
    changePriceRule,
    addDisplayRule,
    changeDisplayRule,
    removeDisplayRule,
    saveUnitsMutation,
    saveRulesMutation,
    saveFormFieldsMutation,
    savePriceRulesMutation,
    saveDisplayRulesMutation,
  };
}
