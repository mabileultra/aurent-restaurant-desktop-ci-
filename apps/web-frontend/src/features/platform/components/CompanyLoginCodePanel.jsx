import React from 'react';

export default function CompanyLoginCodePanel({ isEditing, loginCode, t }) {
  if (!isEditing) {
    return (
      <p className="admin-soft-panel mb-4 px-3 py-2 text-xs border border-aa-line bg-aa-surface-sunken text-aa-ink-muted rounded-aa-md">
        {t('platform.field_loginCodeAutoHint')}
      </p>
    );
  }

  return (
    <div className="mb-4 rounded-aa-md border border-aa-line bg-aa-surface-sunken px-3 py-2">
      <p className="text-xs text-aa-ink-muted">{t('platform.field_loginCode')}</p>
      <p className="mt-1 font-mono text-lg font-semibold tracking-wider text-aa-ink">
        {loginCode || '—'}
      </p>
      <p className="mt-1 text-xs text-aa-ink-muted">{t('platform.field_loginCodeReadonly')}</p>
    </div>
  );
}
