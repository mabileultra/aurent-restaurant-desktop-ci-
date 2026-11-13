import React from 'react';

/**
 * PlatformCompaniesTableHeader — Kompaniyalar jadvalining sarlavha qatori.
 * Ustunlar: «№» · «ID» · «Kompaniya» · «Manzil» · «Kirish kodi» · «Filiallar» · «Faoliyat turi» · «Holati» · amallar.
 */
export default function PlatformCompaniesTableHeader() {
  return (
    <thead>
      <tr>
        <th className="w-12 text-center text-aa-ink-muted tabular-nums">№</th>
        <th className="w-16 font-mono text-aa-ink-muted">ID</th>
        <th>Kompaniya</th>
        <th>Manzil</th>
        <th>Kirish kodi</th>
        <th className="text-right">Filiallar</th>
        <th>Faoliyat turi</th>
        <th>Holati</th>
        <th className="w-12 text-right">
          <span className="sr-only">Amallar</span>
        </th>
      </tr>
    </thead>
  );
}
