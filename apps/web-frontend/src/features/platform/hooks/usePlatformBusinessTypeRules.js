import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformBusinessTypeApi } from '../../../api';
import { mergeFormFieldsState } from '../utils/businessTypeUtils';

export function usePlatformBusinessTypeRules({ activeTypeId, fields, invalidate, t }) {
  const [unitCodes, setUnitCodes] = useState([]);
  const [defaultUnitCode, setDefaultUnitCode] = useState('PCS');
  const [rules, setRules] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [priceRules, setPriceRules] = useState([]);
  const [displayRules, setDisplayRules] = useState([]);

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

  const setFormFieldGroup = (ruleKeys, enabled) => {
    setFormFields((prev) => {
      const byKey = new Map(prev.map((rule) => [rule.ruleKey, rule]));
      for (const ruleKey of ruleKeys) {
        byKey.set(ruleKey, {
          ruleKey,
          ruleValue: enabled ? 'true' : 'false',
          enabled,
        });
      }
      return mergeFormFieldsState(Array.from(byKey.values()));
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
    unitCodes,
    setUnitCodes,
    defaultUnitCode,
    setDefaultUnitCode,
    rules,
    setRules,
    formFields,
    setFormFields,
    priceRules,
    setPriceRules,
    displayRules,
    setDisplayRules,
    saveUnitsMutation,
    saveRulesMutation,
    saveFormFieldsMutation,
    savePriceRulesMutation,
    saveDisplayRulesMutation,
    toggleUnit,
    setDefaultUnit,
    toggleRule,
    toggleFormField,
    setFormFieldGroup,
    changePriceRule,
    addDisplayRule,
    changeDisplayRule,
    removeDisplayRule,
  };
}
