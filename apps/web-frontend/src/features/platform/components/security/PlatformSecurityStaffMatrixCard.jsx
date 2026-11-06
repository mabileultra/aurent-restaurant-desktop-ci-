import React from 'react';

const MATRIX_PERMISSION_BADGES = {
  full: { label: 'To‘liq', cls: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  grant: { label: 'Huquqqa ko‘ra', cls: 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  view: { label: 'Faqat ko‘rish', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  none: { label: '—', cls: 'text-slate-400 font-normal' },
};

export default function PlatformSecurityStaffMatrixCard({ permissionsMatrix }) {
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Rollar va imkoniyatlar matritsasi
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Platformaning har bir roli uchun ruxsatlar taqsimoti
        </p>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Bo‘lim / Imkoniyat</th>
              <th className="py-2.5 px-3 text-center">Super-admin</th>
              <th className="py-2.5 px-3 text-center">Platforma operatori</th>
              <th className="py-2.5 px-3 text-center">Platforma analitigi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {permissionsMatrix.map((row, idx) => {
              const bSa = MATRIX_PERMISSION_BADGES[row.sa] || MATRIX_PERMISSION_BADGES.none;
              const bOp = MATRIX_PERMISSION_BADGES[row.op] || MATRIX_PERMISSION_BADGES.none;
              const bAn = MATRIX_PERMISSION_BADGES[row.an] || MATRIX_PERMISSION_BADGES.none;
              return (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {row.name}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${bSa.cls}`}>
                      {bSa.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${bOp.cls}`}>
                      {bOp.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${bAn.cls}`}>
                      {bAn.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
