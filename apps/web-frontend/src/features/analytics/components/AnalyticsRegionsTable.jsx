import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { fmtMoney, fmtNum, fmtPercent } from '../utils/analyticsFormat';

const DEFAULT_ROWS = [
  {
    name: 'Samarqand viloyati',
    enterprises: 63,
    connected: 16,
    fiscalTurnover: 4090000000,
    nonFiscalTurnover: 99100000,
    totalTurnover: 4190000000,
    fiscalShare: 97.6,
    dynamics: 714.5,
  },
  {
    name: 'Toshkent viloyati',
    enterprises: 1,
    connected: 1,
    fiscalTurnover: 0,
    nonFiscalTurnover: 0,
    totalTurnover: 0,
    fiscalShare: null,
    dynamics: null,
  },
  {
    name: 'Toshkent shahri',
    enterprises: 1,
    connected: 0,
    fiscalTurnover: 0,
    nonFiscalTurnover: 0,
    totalTurnover: 0,
    fiscalShare: null,
    dynamics: null,
  },
  {
    name: 'Hududi ko‘rsatilmagan',
    isMissingRegion: true,
    enterprises: 49,
    connected: 15,
    fiscalTurnover: 150300000,
    nonFiscalTurnover: 54900000,
    totalTurnover: 205200000,
    fiscalShare: 73.3,
    dynamics: null,
  },
];

const EMPTY_REGIONS = [
  'Qoraqalpog‘iston', 'Xorazm', 'Navoiy', 'Buxoro', 'Jizzax',
  'Sirdaryo', 'Namangan', 'Andijon', 'Farg‘ona', 'Qashqadaryo', 'Surxondaryo',
];

export default function AnalyticsRegionsTable({ rows = DEFAULT_ROWS, onExport }) {
  const [showEmpty, setShowEmpty] = useState(false);

  return (
    <div className="an-card" aria-label="Viloyatlar bo‘yicha natijalar">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Viloyatlar bo‘yicha natijalar</h3>
          <p className="an-card-sub">Korxonalar, fiskal ulanish va aylanma · 30 kun</p>
        </div>

        {onExport ? (
          <button type="button" className="an-export-btn" onClick={onExport}>
            <Download size={14} aria-hidden />
            <span>Excel</span>
          </button>
        ) : null}
      </div>

      <div className="an-table-wrap">
        <table className="an-table">
          <thead>
            <tr>
              <th>Viloyat</th>
              <th>Korxonalar</th>
              <th>Fiskal ulanish</th>
              <th>Fiskal aylanma</th>
              <th>Fiskalsiz</th>
              <th>Umumiy aylanma</th>
              <th>Fiskal ulush</th>
              <th>Dinamika</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const connectedPct = row.enterprises > 0
                ? ((row.connected / row.enterprises) * 100).toFixed(1)
                : 0;
              return (
                <tr key={row.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontWeight: 600 }}>{row.name}</span>
                      {row.isMissingRegion ? (
                        <span className="an-badge an-badge--amber">To‘ldirish kerak</span>
                      ) : null}
                    </div>
                  </td>
                  <td>{fmtNum(row.enterprises)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 45, height: 5, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${connectedPct}%`, height: '100%', background: '#059669' }} />
                      </div>
                      <span style={{ fontSize: '0.78rem' }}>
                        {row.connected} / {row.enterprises} · {connectedPct}%
                      </span>
                    </div>
                  </td>
                  <td>{row.fiscalTurnover > 0 ? fmtMoney(row.fiscalTurnover) : '0'}</td>
                  <td>{row.nonFiscalTurnover > 0 ? fmtMoney(row.nonFiscalTurnover) : '0'}</td>
                  <td>
                    {row.totalTurnover > 0 ? (
                      <strong>{fmtMoney(row.totalTurnover)}</strong>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Savdo yo‘q</span>
                    )}
                  </td>
                  <td>
                    {row.fiscalShare != null ? `${fmtPercent(row.fiscalShare)}` : '—'}
                  </td>
                  <td>
                    {row.dynamics != null ? (
                      <span style={{ color: '#059669', fontWeight: 600 }}>
                        ↑ {fmtPercent(row.dynamics)}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}

            {/* Empty Regions Collapsible Toggle */}
            <tr>
              <td colSpan={8} style={{ background: '#f8fafc', padding: '0.65rem 0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                    Yana 11 ta viloyat — korxonalar ro‘yxatdan o‘tmagan
                  </span>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#047857', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}
                    onClick={() => setShowEmpty((prev) => !prev)}
                  >
                    {showEmpty ? 'Yashirish' : 'Ko‘rsatish'}
                  </button>
                </div>
              </td>
            </tr>

            {showEmpty && EMPTY_REGIONS.map((name) => (
              <tr key={name} style={{ color: '#94a3b8' }}>
                <td>{name}</td>
                <td>0</td>
                <td>0 / 0 · 0%</td>
                <td>0</td>
                <td>0</td>
                <td>Savdo yo‘q</td>
                <td>—</td>
                <td>—</td>
              </tr>
            ))}

            {/* Total Row */}
            <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
              <td>Jami</td>
              <td>114</td>
              <td>32 / 114 · 28,1%</td>
              <td>4,24 mlrd</td>
              <td>154,0 mln</td>
              <td>4,40 mlrd</td>
              <td>96,5%</td>
              <td style={{ color: '#059669' }}>↑ 633,6%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
