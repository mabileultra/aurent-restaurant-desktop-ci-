import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { reportingSyncApi } from '../../../api';

function monthStartIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function useReportingSyncPage() {
  const { t } = useTranslation();
  const [backfillFrom, setBackfillFrom] = useState(monthStartIso());
  const [backfillTo, setBackfillTo] = useState(todayIso());
  const [backfillSales, setBackfillSales] = useState(true);
  const [backfillStock, setBackfillStock] = useState(true);
  const [backfillShifts, setBackfillShifts] = useState(true);

  const backfillMutation = useMutation({
    mutationFn: () => {
      const types = [
        backfillSales ? 'sales' : null,
        backfillStock ? 'stock' : null,
        backfillShifts ? 'shifts' : null,
      ].filter(Boolean).join(',');
      return reportingSyncApi.backfill({
        from: backfillFrom,
        to: backfillTo,
        types: types || 'sales',
      }).then((r) => r.data);
    },
    onSuccess: (data) => {
      toast.success(t('reportsSync.backfillSuccess', {
        sales: data.sales?.ingested ?? 0,
        stock: data.stock?.ingested ?? 0,
        shifts: data.shifts?.ingested ?? 0,
        skipped: (data.sales?.skipped ?? 0) + (data.stock?.skipped ?? 0) + (data.shifts?.skipped ?? 0),
      }));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('reportsSync.backfillFailed')),
  });

  return {
    t,
    backfillFrom,
    setBackfillFrom,
    backfillTo,
    setBackfillTo,
    backfillSales,
    setBackfillSales,
    backfillStock,
    setBackfillStock,
    backfillShifts,
    setBackfillShifts,
    backfillMutation,
  };
}
