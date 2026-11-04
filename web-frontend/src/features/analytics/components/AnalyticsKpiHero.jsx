import React from 'react';
import { fmtMoney, fmtNum } from '../utils/analyticsFormat';

export default function AnalyticsKpiHero({ kpi, loading = false }) {
  const totalTurnover = Number(kpi?.totalTurnover || 4400000000);
  const fiscalTurnover = Number(kpi?.fiscalTurnover || 4240000000);
  const nonFiscalTurnover = Number(kpi?.nonFiscalTurnover || 154000000);
  const totalEnterprises = kpi?.totalEnterprises || 114;
  const connected = kpi?.connected || 32;
  const notConnected = kpi?.notConnected || 82;
  const newConnections = kpi?.newConnections || 12;

  const connectedPct = totalEnterprises > 0 ? ((connected / totalEnterprises) * 100).toFixed(1) : '28.1';
  const notConnectedPct = totalEnterprises > 0 ? ((notConnected / totalEnterprises) * 100).toFixed(1) : '71.9';
  const fiscalPct = totalTurnover > 0 ? ((fiscalTurnover / totalTurnover) * 100).toFixed(1) : '96.5';
  const nonFiscalPct = totalTurnover > 0 ? ((nonFiscalTurnover / totalTurnover) * 100).toFixed(1) : '3.5';

  return (
    <section className="an-7kpi-grid" aria-label="Asosiy KPI ko‘rsatkichlari">
      {/* 1. Jami korxonalar */}
      <div className="an-kpi-card">
        <p className="an-kpi-label">Jami korxonalar</p>
        <div className="an-kpi-val">{loading ? '…' : fmtNum(totalEnterprises)}</div>
        <p className="an-kpi-meta">30 tasida savdo bor</p>
      </div>

      {/* 2. Fiskal tizimga ulangan */}
      <div className="an-kpi-card">
        <p className="an-kpi-label">Fiskal tizimga ulangan</p>
        <div className="an-kpi-val">
          {loading ? '…' : fmtNum(connected)}{' '}
          <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>{connectedPct}%</span>
        </div>
        <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
          <div style={{ width: `${connectedPct}%`, height: '100%', background: '#2563eb' }} />
        </div>
      </div>

      {/* 3. Ulanmagan */}
      <div className="an-kpi-card">
        <p className="an-kpi-label">Ulanmagan</p>
        <div className="an-kpi-val">
          {loading ? '…' : fmtNum(notConnected)}{' '}
          <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>{notConnectedPct}%</span>
        </div>
        <p className="an-kpi-meta" style={{ color: '#dc2626', fontWeight: 500 }}>
          9 tasida nofiskal savdo
        </p>
      </div>

      {/* 4. Umumiy aylanma */}
      <div className="an-kpi-card">
        <p className="an-kpi-label">Umumiy aylanma</p>
        <div className="an-kpi-val">{loading ? '…' : fmtMoney(totalTurnover, { showCurrency: false })}</div>
        <p className="an-kpi-meta an-kpi-delta-up">
          ↑ 633,6% +3,80 mlrd
        </p>
      </div>

      {/* 5. Fiskal aylanma */}
      <div className="an-kpi-card">
        <p className="an-kpi-label">
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#2563eb', display: 'inline-block' }} />
          <span>Fiskal aylanma</span>
        </p>
        <div className="an-kpi-val">{loading ? '…' : fmtMoney(fiscalTurnover, { showCurrency: false })}</div>
        <p className="an-kpi-meta">{fiscalPct}% ulush</p>
      </div>

      {/* 6. Nofiskal aylanma */}
      <div className="an-kpi-card">
        <p className="an-kpi-label">
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} />
          <span>Nofiskal aylanma</span>
        </p>
        <div className="an-kpi-val">{loading ? '…' : fmtMoney(nonFiscalTurnover, { showCurrency: false })}</div>
        <p className="an-kpi-meta">{nonFiscalPct}% ulush</p>
      </div>

      {/* 7. Yangi ulanishlar */}
      <div className="an-kpi-card">
        <p className="an-kpi-label">Yangi ulanishlar</p>
        <div className="an-kpi-val">{loading ? '…' : fmtNum(newConnections)}</div>
        <p className="an-kpi-meta an-kpi-delta-up">
          ↑ 50% +4 ta
        </p>
      </div>
    </section>
  );
}
