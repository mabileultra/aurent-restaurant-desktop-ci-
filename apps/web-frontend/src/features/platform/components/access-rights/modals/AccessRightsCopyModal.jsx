import React, { useState, useMemo } from 'react';
import { X, Copy, AlertTriangle, Plus } from 'lucide-react';
import { BaseModal, BaseButton } from '../../../../../components/ui';
import AccessRightsAvatar from '../shared/AccessRightsAvatar';
import AccessRightsCopyCandidateItem from './AccessRightsCopyCandidateItem';
import { resolveRoleLabel } from '../utils/accessRightsCatalogUtils';

export default function AccessRightsCopyModal({
  open,
  isOpen = false,
  onClose,
  sourceUser,
  allUsers = [],
  onConfirmCopy,
  isCopying = false,
}) {
  const isEffectiveOpen = open !== undefined ? Boolean(open) : Boolean(isOpen);
  const [targetUserIds, setTargetUserIds] = useState(new Set());
  const [copyMode, setCopyMode] = useState('merge'); // 'merge' | 'replace'
  const [searchTarget, setSearchTarget] = useState('');

  const sourceRole = sourceUser?.role;
  const sourceName = sourceUser?.fullName || sourceUser?.username;
  const hasExceptions = Boolean(
    sourceUser?.moduleAccessCustom ||
    (sourceUser?.exceptionCount && sourceUser.exceptionCount > 0)
  );

  // Potential targets
  const candidateUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const uid = u.userId || u.id;
      const sId = sourceUser?.userId || sourceUser?.id;
      if (uid === sId) return false;
      if (searchTarget) {
        const q = searchTarget.toLowerCase();
        return (u.fullName || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [allUsers, sourceUser, searchTarget]);

  const targetList = useMemo(() => {
    return allUsers.filter((u) => targetUserIds.has(u.userId || u.id));
  }, [allUsers, targetUserIds]);

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
      mode: copyMode,
    });
  };

  if (!isEffectiveOpen) return null;

  return (
    <BaseModal
      open={isEffectiveOpen}
      onClose={onClose}
      title="Huquqdan nusxa olish"
      subtitle="Bir xodimning istisnolarini shu roldagi boshqa xodimlarga ko‘chiring."
      size="md"
    >
      <div className="space-y-4 text-xs py-1">
        {/* 1. KIMDAN */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">1. KIMDAN</span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AccessRightsAvatar name={sourceName} size="sm" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{sourceName}</span>
                <span className="text-slate-500 ml-1.5">
                  · {resolveRoleLabel(sourceUser?.role)} · {sourceUser?.companyName || 'Kompaniyasiz'}
                </span>
              </div>
            </div>
            {hasExceptions ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Istisno mavjud ({sourceUser?.exceptionCount || 1})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Standart shablon (istisnosiz)
              </span>
            )}
          </div>
        </div>

        {/* 2. KIMGA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-bold text-[11px] uppercase tracking-wider text-slate-500">
            <span>2. KIMGA ({targetUserIds.size} xodim tanlandi)</span>
          </div>

          <input
            type="text"
            value={searchTarget}
            onChange={(e) => setSearchTarget(e.target.value)}
            placeholder="Qabul qiluvchi xodimni qidirish..."
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs dark:border-slate-800 dark:bg-slate-900"
          />

          <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl border-slate-200 dark:border-slate-800">
            {candidateUsers.slice(0, 8).map((u) => {
              const uid = u.userId || u.id;
              const isChecked = targetUserIds.has(uid);
              const isSameRole = u.role === sourceRole;
              return (
                <AccessRightsCopyCandidateItem
                  key={uid}
                  user={u}
                  isChecked={isChecked}
                  isSameRole={isSameRole}
                  sourceRole={sourceRole}
                  onToggle={toggleTarget}
                />
              );
            })}
          </div>
        </div>

        {/* 3. QANDAY KO'CHIRILSIN */}
        <div className="space-y-2">
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">3. QANDAY KO‘CHIRILSIN</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              copyMode === 'merge' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                <input type="radio" name="copyMode" checked={copyMode === 'merge'} onChange={() => setCopyMode('merge')} />
                <span>Istisnolarni qo‘shish</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 pl-5">Xodimning o‘z istisnolari qoladi, manbadagilar qo‘shiladi.</p>
            </label>

            <label className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              copyMode === 'replace' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                <input type="radio" name="copyMode" checked={copyMode === 'replace'} onChange={() => setCopyMode('replace')} />
                <span>To‘liq almashtirish</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 pl-5">Xodimning istisnolari o‘chirilib, manba bilan bir xil bo‘ladi.</p>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500">
            {validTargets.length} xodimga qo‘llanadi
            {invalidTargets.length > 0 && ` · ${invalidTargets.length} tasi o‘tkazib yuboriladi`}
          </span>

          <div className="flex items-center gap-2">
            <BaseButton variant="secondary" size="sm" onClick={onClose}>
              Bekor qilish
            </BaseButton>
            <BaseButton
              variant="primary"
              size="sm"
              disabled={validTargets.length === 0 || isCopying}
              onClick={handleCopy}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              {validTargets.length} xodimga nusxalash
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
