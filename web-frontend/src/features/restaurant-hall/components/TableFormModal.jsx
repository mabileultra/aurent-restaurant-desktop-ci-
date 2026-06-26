import { X } from 'lucide-react';
import { BaseButton, BaseInput } from '../../../components/ui';

export default function TableFormModal({ open, mode, form, onChange, onClose, onSubmit, isPending, t }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {mode === 'edit' ? t('restaurantHall.editTable') : t('restaurantHall.addTable')}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form
          className="grid grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <label className="col-span-1 block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('restaurantHall.tableCode')}
            </span>
            <BaseInput value={form.code} onChange={(e) => onChange({ ...form, code: e.target.value })} required />
          </label>
          <label className="col-span-1 block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('restaurantHall.tableLabel')}
            </span>
            <BaseInput value={form.label} onChange={(e) => onChange({ ...form, label: e.target.value })} />
          </label>
          <label className="col-span-1 block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('restaurantHall.seatCount')}
            </span>
            <BaseInput
              type="number"
              min={1}
              value={form.seatCount}
              onChange={(e) => onChange({ ...form, seatCount: e.target.value })}
              required
            />
          </label>
          <label className="col-span-1 block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">X</span>
            <BaseInput type="number" min={0} value={form.posX} onChange={(e) => onChange({ ...form, posX: e.target.value })} />
          </label>
          <label className="col-span-1 block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Y</span>
            <BaseInput type="number" min={0} value={form.posY} onChange={(e) => onChange({ ...form, posY: e.target.value })} />
          </label>
          <label className="col-span-1 block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('restaurantHall.width')}
            </span>
            <BaseInput type="number" min={20} value={form.width} onChange={(e) => onChange({ ...form, width: e.target.value })} />
          </label>
          <label className="col-span-1 block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('restaurantHall.height')}
            </span>
            <BaseInput type="number" min={20} value={form.height} onChange={(e) => onChange({ ...form, height: e.target.value })} />
          </label>
          <div className="col-span-2 flex justify-end gap-2 pt-2">
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
