import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { fmtDeltaBadge, fmtMoney, fmtNum, fmtPercent } from '../utils/analyticsFormat';
import { exportToCsv } from '../utils/analyticsExport';

export default function AnalyticsRegionsTable({ rows = [], onExport }) {
  const [showEmpty, setShowEmpty] = useState(false);

  const activeRows = rows.filter((r) => Number(r.enterprises || 0) > 0 || Number(r.totalTurnover || 0) > 0);
  const emptyRows = rows.filter((r) => Number(r.enterprises || 0) === 0 && Number(r.totalTurnover || 0) === 0);

  const totals = useMemo(() => {
    let enterprises = 0;
    let connected = 0;
    let fiscal = 0;
    let nonFiscal = 0;
    let total = 0;
    rows.forEach((r) => {
      enterprises += Number(r.enterprises || 0);
      connected += Number(r.connected || 0);
      fiscal += Number(r.fiscalTurnover || 0);
      nonFiscal += Number(r.nonFiscalTurnover || 0);
      total += Number(r.totalTurnover || 0);
    });
    if (total === 0) total = fiscal + nonFiscal;
    const connectedPct = enterprises > 0 ? ((connected / enterprises) * 100).toFixed(1).replace('.', ',') : '0,0';
    const fiscalPct = total > 0 ? fmtPercent((fiscal / total) * 100) : '0,0%';
    return { enterprises, connected, connectedPct, fiscal, nonFiscal, total, fiscalPct };
  }, [rows]);

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }
    const headers = ['Hudud', 'Korxonalar', 'Ulangan', 'Fiskal aylanma', 'Nofiskal aylanma', 'Umumiy aylanma', 'Fiskal ulush', 'O‘sish'];
    const data = rows.map((r) => [
      r.nameUz || r.nameRu || 'Hududi ko‘rsatilmagan',
      r.enterprises || 0,
      `${r.connected || 0} / ${r.enterprises || 0}`,
      fmtMoney(r.fiscalTurnover),
      fmtMoney(r.nonFiscalTurnover),
      fmtMoney(r.totalTurnover),
      fmtPercent(r.fiscalSharePct),
      fmtDeltaBadge(r.turnoverDeltaPct).text,
    ]);
    exportToCsv('hududlar-analitika', headers, data);
  };

  return (
    <div className="an-card" aria-label="Viloyatlar bo‘yicha natijalar">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Viloyatlar bo‘yicha natijalar</h3>
          <p className="an-card-sub">Respublika hududlari va ularning fiskallashuv holati</p>
        </div>
        <button type="button" className="an-btn an-btn--outline" onClick={handleExport}>
          <Download size={14} style={{ color: '#2563EB' }} />
          <span>Excel / CSV</span>
        </button>
      </div>

      <div className="an-table-wrap">
        <table className="an-table">
          <thead>
            <tr>
              <th>Hudud</th>
              <th>Korxonalar</th>
              <th>Ulangan</th>
              <th>Fiskal aylanma</th>
              <th>Nofiskal aylanma</th>
              <th>Umumiy aylanma</th>
              <th>Fiskal ulush</th>
              <th>O‘sish</th>
            </tr>
          </thead>
          <tbody>
            {activeRows.map((row) => {
              const enterprises = Number(row.enterprises || 0);
              const connected = Number(row.connected || 0);
              const connectedPct = enterprises > 0 ? ((connected / enterprises) * 100).toFixed(1).replace('.', ',') : '0,0';
              const name = row.nameUz || row.nameRu || 'Hududi ko‘rsatilmagan';
              const isMissing = !row.code || row.code === '0' || name.toLowerCase().includes('ko‘rsatilmagan');
              const delta = fmtDeltaBadge(row.turnoverDeltaPct);

              return (
                <tr key={row.code || name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontWeight: 600 }}>{name}</span>
                      {isMissing && <span className="an-badge an-badge--amber">To‘ldirish kerak</span>}
                    </div>
                  </td>
                  <td>{fmtNum(enterprises)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 45, height: 5, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${connectedPct.replace(',', '.')}%`, height: '100%', background: '#2563EB' }} />
                      </div>
                      <span style={{ fontSize: '0.78rem' }}>
                        {connected} / {enterprises} · {connectedPct}%
                      </span>
                    </div>
                  </td>
                  <td>{fmtMoney(row.fiscalTurnover)}</td>
                  <td>{fmtMoney(row.nonFiscalTurnover)}</td>
                  <td>
                    {Number(row.totalTurnover || 0) > 0 ? (
                      <strong>{fmtMoney(row.totalTurnover)}</strong>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Savdo yo‘q</span>
                    )}
                  </td>
                  <td>{fmtPercent(row.fiscalSharePct)}</td>
                  <td>
                    <span className={delta.dir} style={{ fontWeight: 600 }}>
                      {delta.text}
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* Empty Regions Toggle */}
            {emptyRows.length > 0 && (
              <tr>
                <td colSpan={8} style={{ background: '#f8fafc', padding: '0.65rem 0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                      Yana {emptyRows.length} ta hudud — korxonalar ro‘yxatdan o‘tmagan
                    </span>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}
                      onClick={() => setShowEmpty((prev) => !prev)}
                    >
                      {showEmpty ? 'Yashirish' : 'Ko‘rsatish'}
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {showEmpty && emptyRows.map((r) => (
              <tr key={r.code || r.nameUz} style={{ color: '#94a3b8' }}>
                <td>{r.nameUz || r.nameRu}</td>
                <td>0</td>
                <td>0 / 0 · 0%</td>
                <td>0</td>
                <td>0</td>
                <td>Savdo yo‘q</td>
                <td>—</td>
                <td>—</td>
              </tr>
            ))}

            {/* Dynamic Total Row */}
            <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
              <td>Jami</td>
              <td>{fmtNum(totals.enterprises)}</td>
              <td>{totals.connected} / {totals.enterprises} · {totals.connectedPct}%</td>
              <td>{fmtMoney(totals.fiscal)}</td>
              <td>{fmtMoney(totals.nonFiscal)}</td>
              <td>{fmtMoney(totals.total)}</td>
              <td>{totals.fiscalPct}</td>
              <td style={{ color: '#2563EB' }}>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
