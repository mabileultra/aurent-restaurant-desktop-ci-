import { useState } from 'react';
import toast from 'react-hot-toast';
import { INITIAL_TEMPLATES_CONFIG } from '../utils/emailConstants';

export function useEmailTemplatesFlow() {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES_CONFIG);
  const [selectedKey, setSelectedKey] = useState('USER_CREDENTIALS');
  const [lang, setLang] = useState('uz');

  const currentTemplate = templates[selectedKey] || templates.USER_CREDENTIALS;
  const currentLangContent = currentTemplate[lang] || currentTemplate.uz;

  const toggleTemplateEnabled = (key, e) => {
    e?.stopPropagation?.();
    setTemplates((prev) => {
      const target = prev[key];
      if (!target || !target.hasSwitch) return prev;
      return {
        ...prev,
        [key]: {
          ...target,
          enabled: !target.enabled,
        },
      };
    });
  };

  const handleUpdateField = (field, value) => {
    setTemplates((prev) => ({
      ...prev,
      [selectedKey]: {
        ...prev[selectedKey],
        [lang]: {
          ...prev[selectedKey][lang],
          [field]: value,
        },
      },
    }));
  };

  const insertVariable = (varKey) => {
    const curBody = currentLangContent.body;
    handleUpdateField('body', `${curBody} ${varKey}`);
  };

  const handleResetToDefault = () => {
    const defaults = INITIAL_TEMPLATES_CONFIG[selectedKey];
    if (!defaults) return;
    setTemplates((prev) => ({
      ...prev,
      [selectedKey]: {
        ...prev[selectedKey],
        [lang]: { ...defaults[lang] },
      },
    }));
    toast.success('Shablon standart holatiga qaytarildi');
  };

  const handleSave = () => {
    toast.success('Shablon o‘zgarishlari muvaffaqiyatli saqlandi');
  };

  const handleTestEmail = () => {
    toast.success('Namuna xat shaxsiy pochtangizga yuborildi');
  };

  return {
    templatesList: Object.values(templates),
    selectedKey,
    setSelectedKey,
    currentTemplate,
    currentLangContent,
    lang,
    setLang,
    toggleTemplateEnabled,
    handleUpdateField,
    insertVariable,
    handleResetToDefault,
    handleSave,
    handleTestEmail,
  };
}
