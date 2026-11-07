import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { HISTORY_TYPES } from '../utils/emailConstants';
import { formatNumberWithSpaces } from '../utils/emailFormatUtils';

const PAGE_SIZE = 5;

export const EMAIL_HISTORY_DATE_PRESETS = [
  { id: 'all', label: 'Barcha sanalar' },
  { id: 'today', label: 'Bugun' },
  { id: '7days', label: 'Oxirgi 7 kun' },
  { id: '30days', label: 'Oxirgi 30 kun' },
];

export function useEmailHistoryFlow(options = {}) {
  const [typeFilter, setTypeFilter] = useState(options.initialType || 'all');
  const [search, setSearch] = useState(options.initialSearch || '');
  const [dateFilter, setDateFilter] = useState(options.initialDate || 'all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [rows, setRows] = useState(() => options.initialRows ?? []);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (typeFilter !== 'all') {
      result = result.filter((r) => r.type === typeFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.subject?.toLowerCase().includes(q) ||
          r.audience?.toLowerCase().includes(q) ||
          r.sender?.toLowerCase().includes(q)
      );
    }
    if (dateFilter === 'today') {
      result = result.filter((r) => r.time?.toLowerCase().includes('bugun'));
    } else if (dateFilter === '7days') {
      result = result.filter((r) => r.time?.toLowerCase().includes('bugun') || r.time?.toLowerCase().includes('noy'));
    }
    return result;
  }, [rows, typeFilter, search, dateFilter]);

  const selectedRow = useMemo(() => {
    if (filteredRows.length === 0) return null;
    return filteredRows.find((r) => r.id === selectedId) || filteredRows[0];
  }, [filteredRows, selectedId]);

  const totalCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalCount);
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  const paginationLabel = totalCount === 0
    ? '0 ta xabar'
    : `${startIndex + 1}–${endIndex} / ${totalCount} ta xabar`;

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setDateFilter('all');
    setPage(1);
  };

  const handleRetryFails = (rowId) => {
    toast.error('Xatolarni qayta yuborish tez kunda ishga tushadi');
  };

  const stats = useMemo(() => {
    const totalSent = rows.reduce((acc, r) => acc + (r.total || 0), 0);
    const totalOk = rows.reduce((acc, r) => acc + (r.ok || 0), 0);
    const totalFail = rows.reduce((acc, r) => acc + (r.fail || 0), 0);
    const totalQueued = rows.reduce((acc, r) => acc + (r.queued || 0), 0);
    const bulkCount = rows.filter((r) => r.type === 'bulk').length;
    const autoCount = rows.filter((r) => r.type !== 'bulk').length;
    const deliveryRate = totalSent > 0 ? ((totalOk / totalSent) * 100).toFixed(1) : null;

    return {
      totalSent: formatNumberWithSpaces(totalSent),
      deliveryRate: deliveryRate ? `${deliveryRate.replace('.', ',')}%` : '—',
      totalFail: formatNumberWithSpaces(totalFail),
      totalQueued: formatNumberWithSpaces(totalQueued),
      bulkCount,
      autoCount,
      hasData: totalSent > 0,
    };
  }, [rows]);

  return {
    typeFilter,
    setTypeFilter: (val) => { setTypeFilter(val); setPage(1); },
    types: HISTORY_TYPES,
    search,
    setSearch: (val) => { setSearch(val); setPage(1); },
    dateFilter,
    setDateFilter: (val) => { setDateFilter(val); setPage(1); },
    datePresets: EMAIL_HISTORY_DATE_PRESETS,
    page: currentPage,
    totalPages,
    canPrev: currentPage > 1,
    canNext: currentPage < totalPages,
    handlePrevPage,
    handleNextPage,
    paginationLabel,
    totalCount,
    rows: paginatedRows,
    allFilteredRows: filteredRows,
    selectedRow,
    setSelectedId,
    stats,
    handleRetryFails,
    clearFilters,
  };
}
