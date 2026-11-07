import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { platformEmailApi } from '../../../api';
import { INITIAL_TEMPLATES_CONFIG } from '../utils/emailConstants';

const TEMPLATE_TRANSLATIONS = {
  USER_CREDENTIALS: {
    titleUz: 'Kirish ma’lumotlari',
    descUz: 'Yangi foydalanuvchi yaratilganda unga avtomatik yuboriladi',
  },
  SUPER_ADMIN_LOGIN: {
    titleUz: 'Super-admin kirishi',
    descUz: 'SUPER_ADMIN roli bilan kirilganda nazorat manzillariga yuboriladi',
  },
  BROADCAST: {
    titleUz: 'Ommaviy xabar',
    descUz: 'Pochta › Yuborish sahifasidan yuboriladigan xatlar qolipi',
  },
};

export function useEmailTemplatesFlow() {
  const { i18n } = useTranslation();
  const [selectedKey, setSelectedKey] = useState('USER_CREDENTIALS');
  const [lang, setLang] = useState('uz');

  // Real backend query for email templates
  const { data: remoteTemplates, isLoading } = useQuery({
    queryKey: ['platform-email-templates'],
    queryFn: () => platformEmailApi.templates().then((r) => r.data).catch(() => null),
  });

  const templatesList = useMemo(() => {
    if (Array.isArray(remoteTemplates) && remoteTemplates.length > 0) {
      return remoteTemplates.map((rt) => {
        const key = rt.type;
        const fallback = INITIAL_TEMPLATES_CONFIG[key] || {};
        const tr = TEMPLATE_TRANSLATIONS[key] || {};
        const isUz = i18n.language === 'uz';

        return {
          ...fallback,
          id: key.toLowerCase(),
          code: key,
          title: isUz ? tr.titleUz || rt.title : rt.title,
          trigger: isUz ? tr.descUz || rt.description : rt.description,
          vars: Array.isArray(rt.variables)
            ? rt.variables.map((v) => ({ key: `{{${v}}}`, desc: v }))
            : fallback.vars || [],
        };
      });
    }
    return Object.values(INITIAL_TEMPLATES_CONFIG);
  }, [remoteTemplates, i18n.language]);

  const currentTemplate = useMemo(() => {
    return templatesList.find((t) => t.code === selectedKey) || templatesList[0] || INITIAL_TEMPLATES_CONFIG.USER_CREDENTIALS;
  }, [templatesList, selectedKey]);

  const currentLangContent = useMemo(() => {
    const fallback = INITIAL_TEMPLATES_CONFIG[selectedKey] || INITIAL_TEMPLATES_CONFIG.USER_CREDENTIALS;
    return fallback[lang] || fallback.uz;
  }, [selectedKey, lang]);

  const handleUpdateField = () => {};
  const insertVariable = () => {};
  const handleResetToDefault = () => {};
  const handleSave = () => {};
  const handleTestEmail = () => {};

  return {
    templatesList,
    selectedKey,
    setSelectedKey,
    currentTemplate,
    currentLangContent,
    lang,
    setLang,
    isLoading,
    isViewOnly: true,
    handleUpdateField,
    insertVariable,
    handleResetToDefault,
    handleSave,
    handleTestEmail,
  };
}
