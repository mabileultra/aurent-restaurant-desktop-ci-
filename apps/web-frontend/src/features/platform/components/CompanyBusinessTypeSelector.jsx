import React from 'react';
import Badge from '../../../components/aa/Badge';
import Button from '../../../components/aa/Button';

/**
 * CompanyBusinessTypeSelector — Kompaniya faoliyat turlarini tanlash fieldset bloki.
 * Chegarasi line-strong bo‘lgan ro‘yxat, har bir qator 44px, asosiy turda «Asosiy» Badge.
 */
export default function CompanyBusinessTypeSelector({
  t,
  form,
  businessTypes = [],
  onToggleBusinessType,
  onSetDefaultBusinessType,
  error,
}) {
  const safeBusinessTypes = Array.isArray(businessTypes)
    ? businessTypes
    : Array.isArray(businessTypes?.data)
      ? businessTypes.data
      : [];

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-aa-ink">
        Faoliyat turlari
      </legend>

      <div className="border border-aa-line-strong rounded-aa-md overflow-hidden divide-y divide-aa-line bg-aa-surface">
        {safeBusinessTypes.map((bt) => {
          const checked = form.businessTypeIds?.includes(bt.id);
          const isDefault = form.defaultBusinessTypeId === bt.id;
          const displayName = t
            ? t(`productTemplates.businessTypes.${bt.code}`, { defaultValue: bt.name })
            : bt.name || bt.code;

          return (
            <div
              key={bt.id}
              className="h-[44px] px-3.5 flex items-center justify-between gap-3 text-sm hover:bg-aa-surface-hover transition-colors select-none"
            >
              <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={Boolean(checked)}
                  onChange={() => onToggleBusinessType?.(bt.id)}
                  className="accent-[var(--aa-brand)] w-4 h-4 cursor-pointer rounded-aa-sm"
                />
                <span className="font-medium text-sm text-aa-ink truncate">
                  {displayName}
                </span>
              </label>

              {checked && (
                <div className="shrink-0 flex items-center">
                  {isDefault ? (
                    <Badge tone="brand">Asosiy</Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        onSetDefaultBusinessType?.(bt.id);
                      }}
                      className="!h-7 !px-2 text-xs"
                    >
                      Asosiy qilish
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error ? (
        <p className="text-xs text-aa-danger mt-1" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-aa-ink-muted">
          Bir yoki bir nechta tur tanlang. Asosiy tur yangi filiallarga avtomatik beriladi.
        </p>
      )}
    </fieldset>
  );
}
