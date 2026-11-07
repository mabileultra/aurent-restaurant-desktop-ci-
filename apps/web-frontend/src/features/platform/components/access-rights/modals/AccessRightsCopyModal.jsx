import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal, BaseButton } from '../../../../../components/ui';
import AccessRightsAvatar from '../shared/AccessRightsAvatar';
import AccessRightsCopyCandidateItem from './AccessRightsCopyCandidateItem';
import AccessRightsCopyStrategySelector from './AccessRightsCopyStrategySelector';
import { resolveRoleLabel } from '../utils/accessRightsCatalogUtils';

export default function AccessRightsCopyModal({
  open,
  isOpen = false,
  onClose,
  sourceUser,
  allUsers = [],
  initialTargetIds = [],
  onConfirmCopy,
  isCopying = false,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const isEffectiveOpen = open !== undefined ? Boolean(open) : Boolean(isOpen);

  const sId = sourceUser?.userId || sourceUser?.id;
  const [targetUserIds, setTargetUserIds] = useState(() => {
    const s = new Set(initialTargetIds);
    if (sId) s.delete(sId);
    return s;
  });
  const [copyMode, setCopyMode] = useState('merge');
  const [searchTarget, setSearchTarget] = useState('');

  useEffect(() => {
    const s = new Set(initialTargetIds);
    if (sId) s.delete(sId);
    setTargetUserIds(s);
  }, [initialTargetIds, sId]);

  const sourceRole = sourceUser?.role;
  const sourceName = sourceUser?.fullName || sourceUser?.username;
  const exceptionCount = Number(
    sourceUser?.exceptionCount || (sourceUser?.moduleAccessCustom ? 1 : 0)
  );

  const candidateUsers = useMemo(() => {
    const q = searchTarget.trim().toLowerCase();
    const filtered = allUsers.filter((u) => {
      const uid = u.userId || u.id;
      if (uid === sId) return false;
      if (!q) return true;
      return (u.fullName || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
    });
    return filtered.sort((a, b) => {
      const aId = a.userId || a.id;
      const bId = b.userId || b.id;
      const aChecked = targetUserIds.has(aId) ? 1 : 0;
      const bChecked = targetUserIds.has(bId) ? 1 : 0;
      if (aChecked !== bChecked) return bChecked - aChecked;
      const aSame = a.role === sourceRole ? 1 : 0;
      const bSame = b.role === sourceRole ? 1 : 0;
      if (aSame !== bSame) return bSame - aSame;
      return (a.fullName || a.username || '').localeCompare(b.fullName || b.username || '');
    });
  }, [allUsers, sId, searchTarget, sourceRole, targetUserIds]);

  const targetList = useMemo(() => allUsers.filter((u) => targetUserIds.has(u.userId || u.id)), [allUsers, targetUserIds]);
  const validTargets = targetList.filter((u) => u.role === sourceRole);
  const invalidTargets = targetList.filter((u) => u.role !== sourceRole);

  const toggleTarget = (uid) => {
    setTargetUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleCopy = () => {
    if (validTargets.length === 0) return;
    onConfirmCopy({
      sourceUserId: sourceUser?.userId || sourceUser?.id,
      targetUserIds: validTargets.map((u) => u.userId || u.id),
      strategy: copyMode === 'replace' ? 'REPLACE' : 'MERGE',
    });
  };

  if (!isEffectiveOpen) return null;

  return (
    <BaseModal
      open={isEffectiveOpen}
      onClose={onClose}
      title={isRu ? 'Копирование прав доступа' : 'Huquqdan nusxa olish'}
      subtitle={
        isRu
          ? 'Копирование исключений сотрудника другим сотрудникам с такой же ролью.'
          : 'Bir xodimning istisnolarini shu roldagi boshqa xodimlarga ko‘chiring.'
      }
      size="md"
    >
      <div className="space-y-4 text-xs py-1">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
            {isRu ? '1. ОТ КОГО' : '1. KIMDAN'}
          </span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AccessRightsAvatar name={sourceName} size="sm" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{sourceName}</span>
                <span className="text-slate-500 ml-1.5">
                  · {resolveRoleLabel(sourceUser?.role, isRu ? 'ru' : 'uz')} ·{' '}
                  {sourceUser?.companyName || (isRu ? 'Без компании' : 'Kompaniyasiz')}
                </span>
              </div>
            </div>
            {exceptionCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {isRu ? `Исключений: ${exceptionCount}` : `Istisno mavjud (${exceptionCount})`}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {isRu ? 'Стандартный шаблон' : 'Standart shablon'}
              </span>
            )}
          </div>
        </div>

        {exceptionCount === 0 && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 font-semibold text-xs">
            {isRu
              ? 'У выбранного сотрудника нет исключений (действует стандартный шаблон). Копирование не требуется.'
              : 'Tanlangan xodimda maxsus istisnolar mavjud emas (standart shablon bo‘yicha). Nusxalash talab etilmaydi.'}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between font-bold text-[11px] uppercase tracking-wider text-slate-500">
            <span>{isRu ? `2. КОМУ (${targetUserIds.size} выбрано)` : `2. KIMGA (${targetUserIds.size} xodim tanlandi)`}</span>
          </div>
          <input
            type="text"
            value={searchTarget}
            onChange={(e) => setSearchTarget(e.target.value)}
            placeholder={isRu ? 'Поиск получателя...' : 'Qabul qiluvchi xodimni qidirish...'}
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs dark:border-slate-800 dark:bg-slate-900"
          />
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl border-slate-200 dark:border-slate-800">
            {candidateUsers.map((u) => {
              const uid = u.userId || u.id;
              return (
                <AccessRightsCopyCandidateItem
                  key={uid}
                  user={u}
                  isChecked={targetUserIds.has(uid)}
                  isSameRole={u.role === sourceRole}
                  sourceRole={sourceRole}
                  onToggle={toggleTarget}
                />
              );
            })}
          </div>
        </div>

        <AccessRightsCopyStrategySelector
          copyMode={copyMode}
          onChangeMode={setCopyMode}
          isRu={isRu}
        />

        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {isRu ? `Применится: ${validTargets.length}` : `${validTargets.length} xodimga qo‘llanadi`}
            {invalidTargets.length > 0 && (isRu ? ` · ${invalidTargets.length} пропущено` : ` · ${invalidTargets.length} tasi o‘tkazib yuboriladi`)}
          </span>

          <div className="flex items-center gap-2">
            <BaseButton variant="secondary" size="sm" onClick={onClose}>
              {isRu ? 'Отмена' : 'Bekor qilish'}
            </BaseButton>
            <BaseButton
              variant="primary"
              size="sm"
              disabled={exceptionCount === 0 || validTargets.length === 0 || isCopying}
              onClick={handleCopy}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              {isRu ? `Скопировать (${validTargets.length})` : `${validTargets.length} xodimga nusxalash`}
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
