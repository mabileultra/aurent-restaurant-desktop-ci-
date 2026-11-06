import React, { useState } from 'react';
import { BaseModal, BaseButton } from '../../../../../components/ui';

export default function AccessRightsCopyTemplateModal({
  open,
  isOpen = false,
  onClose,
  targetBT,
  targetRole,
  businessTypes = [],
  onConfirm,
  isLoading = false,
}) {
  const isEffectiveOpen = open !== undefined ? Boolean(open) : Boolean(isOpen);
  const [sourceBT, setSourceBT] = useState(targetBT || 'RESTAURANT');
  const [sourceRole, setSourceRole] = useState('ADMIN');

  const roles = [
    { code: 'ADMIN', name: 'Admin' },
    { code: 'MANAGER', name: 'Menejer' },
    { code: 'CASHIER', name: 'Kassir' },
    { code: 'WAITER', name: 'Ofitsiant' },
    { code: 'COOK', name: 'Oshpaz' },
  ];

  const handleCopy = () => {
    onConfirm({ sourceBT, sourceRole });
  };

  if (!isEffectiveOpen) return null;

  return (
    <BaseModal
      open={isEffectiveOpen}
      onClose={onClose}
      title="Boshqa shablondan nusxa olish"
      subtitle="Boshqa faoliyat turi yoki roldagi modullar ro‘yxatini ushbu shablonga ko‘chirish."
      size="sm"
    >
      <div className="space-y-4 py-2 text-xs">
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Qaysi faoliyat turidan:
          </label>
          <select
            value={sourceBT}
            onChange={(e) => setSourceBT(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs dark:border-slate-800 dark:bg-slate-900"
          >
            {businessTypes.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Qaysi roldan:
          </label>
          <select
            value={sourceRole}
            onChange={(e) => setSourceRole(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs dark:border-slate-800 dark:bg-slate-900"
          >
            {roles.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <BaseButton variant="secondary" size="sm" onClick={onClose}>
            Bekor qilish
          </BaseButton>
          <BaseButton
            variant="primary"
            size="sm"
            disabled={isLoading}
            onClick={handleCopy}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
          >
            Nusxani qo‘llash
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
