import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal, BaseButton } from '../../../../../components/ui';
import PlatformSelect from '../../PlatformSelect';
import { rolesForBusinessType } from '../../../utils/rolesByBusinessType';
import { resolveRoleLabel, resolveBusinessTypeName } from '../utils/accessRightsCatalogUtils';

export default function AccessRightsCopyTemplateModal({
  open,
  isOpen = false,
  onClose,
  targetBT = 'RESTAURANT',
  targetRole = 'ADMIN',
  businessTypes = [],
  onConfirm,
  isLoading = false,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const isEffectiveOpen = open !== undefined ? Boolean(open) : Boolean(isOpen);

  const [sourceBT, setSourceBT] = useState(() => targetBT || 'RESTAURANT');
  const [sourceRole, setSourceRole] = useState('ADMIN');

  const availableRoles = useMemo(() => {
    const codes = rolesForBusinessType(sourceBT);
    return codes.map((code) => ({
      code,
      name: resolveRoleLabel(code, isRu ? 'ru' : 'uz'),
    }));
  }, [sourceBT, isRu]);

  const businessTypeOptions = useMemo(() => {
    return businessTypes
      .filter((b) => b.code !== 'ALL')
      .map((b) => ({ value: b.code, label: b.name }));
  }, [businessTypes]);

  const roleOptions = useMemo(() => {
    return availableRoles.map((r) => ({ value: r.code, label: r.name }));
  }, [availableRoles]);

  const targetBTName = resolveBusinessTypeName(targetBT, isRu ? 'ru' : 'uz');
  const targetRoleName = resolveRoleLabel(targetRole, isRu ? 'ru' : 'uz');

  const handleCopy = () => {
    onConfirm({ sourceBT, sourceRole, targetBT, targetRole });
  };

  if (!isEffectiveOpen) return null;

  return (
    <BaseModal
      open={isEffectiveOpen}
      onClose={onClose}
      title={isRu ? 'Копирование из другого шаблона' : 'Boshqa shablondan nusxa olish'}
      subtitle={
        isRu
          ? 'Перенос настроек модулей из другого направления или роли в текущий шаблон.'
          : 'Boshqa faoliyat turi yoki roldagi modullar ro‘yxatini ushbu shablonga ko‘chirish.'
      }
      size="sm"
    >
      <div className="space-y-4 py-2 text-xs">
        {/* Destination notice */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
            {isRu ? 'КУДА ПРИМЕНЯЕТСЯ:' : 'QAYERGA QO‘LLANADI:'}
          </span>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {targetBTName} · {targetRoleName}
          </div>
        </div>

        {/* Source Business Type */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            {isRu ? 'Из какого направления бизнеса:' : 'Qaysi faoliyat turidan:'}
          </label>
          <PlatformSelect
            options={businessTypeOptions}
            value={sourceBT}
            onChange={(e) => {
              const nextBT = e.target.value;
              setSourceBT(nextBT);
              const nextRoles = rolesForBusinessType(nextBT);
              if (!nextRoles.includes(sourceRole)) {
                setSourceRole(nextRoles[0] || 'ADMIN');
              }
            }}
            size="sm"
            ariaLabel={isRu ? 'Направление бизнеса' : 'Faoliyat turi'}
          />
        </div>

        {/* Source Role */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            {isRu ? 'Из какой роли:' : 'Qaysi roldan:'}
          </label>
          <PlatformSelect
            options={roleOptions}
            value={sourceRole}
            onChange={(e) => setSourceRole(e.target.value)}
            size="sm"
            ariaLabel={isRu ? 'Роль' : 'Rol'}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <BaseButton variant="secondary" size="sm" onClick={onClose}>
            {isRu ? 'Отмена' : 'Bekor qilish'}
          </BaseButton>
          <BaseButton
            variant="primary"
            size="sm"
            disabled={isLoading}
            onClick={handleCopy}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
          >
            {isLoading
              ? (isRu ? 'Копирование...' : 'Nusxalanmoqda...')
              : (isRu ? 'Применить шаблон' : 'Nusxani qo‘llash')}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
