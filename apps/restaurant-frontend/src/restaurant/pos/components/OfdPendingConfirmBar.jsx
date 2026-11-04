import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { isRestaurantDesktop } from '../../../utils/restaurantDesktop';
import {
  flushPendingFiscals,
  getPendingFiscalCount,
  subscribePendingFiscals,
} from '../utils/pendingFiscalQueue';

/**
 * Restaurant-desktop only: never silent OFD send.
 * Shows «Есть N чеков в очереди. Отправить в ОФД?» with explicit Да.
 */
export default function OfdPendingConfirmBar() {
  const { t } = useTranslation();
  const [count, setCount] = useState(() => (isRestaurantDesktop() ? getPendingFiscalCount() : 0));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isRestaurantDesktop()) return undefined;
    setCount(getPendingFiscalCount());
    return subscribePendingFiscals(setCount);
  }, []);

  const onConfirm = useCallback(async () => {
    if (busy || count <= 0) return;
    const ok = window.confirm(
      t('rst.ofd.sendConfirm', {
        count,
        defaultValue: 'Есть {{count}} чеков в очереди. Отправить в ОФД?',
      })
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await flushPendingFiscals();
      if (res.done > 0) {
        toast.success(t('rst.ofd.sent', {
          done: res.done,
          defaultValue: 'Отправлено в ОФД: {{done}}',
        }));
      }
      if (res.left > 0) {
        toast.error(t('rst.ofd.partial', {
          left: res.left,
          defaultValue: 'Не удалось отправить: {{left}}. Остались в очереди.',
        }));
      }
    } catch (err) {
      toast.error(err?.message || t('rst.ofd.failed', { defaultValue: 'Ошибка отправки в ОФД' }));
    } finally {
      setBusy(false);
      setCount(getPendingFiscalCount());
    }
  }, [busy, count, t]);

  if (!isRestaurantDesktop() || count <= 0) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 9999,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: 10,
        background: '#1e293b',
        color: '#f8fafc',
        boxShadow: '0 8px 24px rgba(0,0,0,.35)',
        fontSize: 14,
      }}
    >
      <span>
        {t('rst.ofd.queueHint', {
          count,
          defaultValue: 'Есть {{count}} чеков в очереди ОФД',
        })}
      </span>
      <button
        type="button"
        disabled={busy || typeof navigator !== 'undefined' && navigator.onLine === false}
        onClick={onConfirm}
        style={{
          border: 0,
          borderRadius: 8,
          padding: '8px 14px',
          background: '#22c55e',
          color: '#052e16',
          fontWeight: 600,
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy
          ? t('rst.ofd.sending', { defaultValue: 'Отправка…' })
          : t('rst.ofd.sendYes', { defaultValue: 'Отправить в ОФД' })}
      </button>
    </div>
  );
}
