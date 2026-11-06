import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { HISTORY_TYPES, INITIAL_HISTORY_ROWS } from '../utils/emailConstants';
import { formatNumberWithSpaces } from '../utils/emailFormatUtils';

export function useEmailHistoryFlow() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('b1');
  const [rows, setRows] = useState(INITIAL_HISTORY_ROWS);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (typeFilter !== 'all') {
      result = result.filter((r) => r.type === typeFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.subject.toLowerCase().includes(q) ||
          r.audience.toLowerCase().includes(q) ||
          r.sender.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rows, typeFilter, search]);

  const selectedRow = useMemo(() => {
    return rows.find((r) => r.id === selectedId) || rows[0];
  }, [rows, selectedId]);

  const handleRetryFails = (rowId) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          return {
            ...r,
            ok: r.ok + r.fail,
            fail: 0,
            fails: [],
          };
        }
        return r;
      })
    );
    toast.success('Xatolik yuz bergan manzillarga xat qayta jo‘natildi');
  };

  const stats = useMemo(() => {
    const totalSent = rows.reduce((acc, r) => acc + r.total, 0);
    const totalOk = rows.reduce((acc, r) => acc + r.ok, 0);
    const totalFail = rows.reduce((acc, r) => acc + r.fail, 0);
    const totalQueued = rows.reduce((acc, r) => acc + r.queued, 0);
    const deliveryRate = totalSent > 0 ? ((totalOk / totalSent) * 100).toFixed(1) : '100.0';

    return {
      totalSent: formatNumberWithSpaces(totalSent),
      deliveryRate: `${deliveryRate.replace('.', ',')}%`,
      totalFail: formatNumberWithSpaces(totalFail),
      totalQueued: formatNumberWithSpaces(totalQueued),
    };
  }, [rows]);

  return {
    typeFilter,
    setTypeFilter,
    types: HISTORY_TYPES,
    search,
    setSearch,
    rows: filteredRows,
    selectedRow,
    setSelectedId,
    stats,
    handleRetryFails,
  };
}
