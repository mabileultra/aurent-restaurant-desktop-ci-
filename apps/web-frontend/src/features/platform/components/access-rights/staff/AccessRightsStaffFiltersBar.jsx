import React from 'react';
import { Search } from 'lucide-react';

export default function AccessRightsStaffFiltersBar({
  searchTerm = '',
  onSearchChange,
  businessTypes = [],
  selectedBT = 'ALL',
  onSelectBT,
  companies = [],
  selectedCompanyId = '',
  onSelectCompanyId,
  selectedRole = 'ALL',
  onSelectRole,
}) {
  const roles = [
    { code: 'ALL', name: 'Barcha rollar' },
    { code: 'ADMIN', name: 'Admin' },
    { code: 'MANAGER', name: 'Menejer' },
    { code: 'CASHIER', name: 'Kassir' },
    { code: 'WAITER', name: 'Ofitsiant' },
    { code: 'COOK', name: 'Oshpaz' },
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Ism, login yoki kompaniya bo‘yicha qidiruv..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        {/* Faoliyat turi */}
        <select
          value={selectedBT}
          onChange={(e) => onSelectBT(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="ALL">Faoliyat turi: barchasi</option>
          {businessTypes.map((bt) => (
            <option key={bt.code} value={bt.code}>
              {bt.name}
            </option>
          ))}
        </select>

        {/* Kompaniya */}
        <select
          value={selectedCompanyId}
          onChange={(e) => onSelectCompanyId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[200px] truncate"
        >
          <option value="">Kompaniya: barchasi</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Rol */}
        <select
          value={selectedRole}
          onChange={(e) => onSelectRole(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {roles.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
