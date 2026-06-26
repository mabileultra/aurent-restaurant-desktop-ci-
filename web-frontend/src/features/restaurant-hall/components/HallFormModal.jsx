import { X } from 'lucide-react';
import { BaseButton, BaseInput } from '../../../components/ui';

export default function HallFormModal({ open, mode, form, onChange, onClose, onSubmit, isPending, t }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {mode === 'edit' ? t('restaurantHall.editHall') : t('restaurantHall.addHall')}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('restaurantHall.hallName')}
            </span>
            <BaseInput value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('restaurantHall.sortOrder')}
            </span>
            <BaseInput
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => onChange({ ...form, sortOrder: e.target.value })}
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <BaseButton type="button" variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </BaseButton>
            <BaseButton type="submit" disabled={isPending}>
              {t('common.save')}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}
