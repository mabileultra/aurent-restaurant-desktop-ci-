import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fmtMoney, fmtPercent, sanitizeText } from '../utils/analyticsFormat';

export default function AnalyticsTopCompaniesCard({
  companies = [],
  totalTurnover,
  periodLabel = '30 kun',
}) {
  const list = Array.isArray(companies) ? companies.slice(0, 10) : [];
  const maxAmount = list.length > 0 ? Math.max(...list.map((c) => Number(c.totalTurnover || 0)), 1) : 1;
  const totalSum = list.reduce((sum, c) => sum + Number(c.totalTurnover || 0), 0);
  const baseTurnover = Number(totalTurnover || 0) > 0 ? Number(totalTurnover) : totalSum;

  return (
    <section
      className="card"
      aria-labelledby="top10"
      style={{
        flex: '3 1 560px',
        minWidth: 0,
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 id="top10" className="t">Aylanma bo‘yicha TOP-10 korxona</h2>
          <p className="s">{periodLabel} · bosilsa korxona detalizatsiyasi ochiladi</p>
        </div>
        <Link to="/platform/analytics/companies" className="btn">
          <span>Barchasi</span>
          <ChevronRight className="ic" />
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '14px' }}>
        {list.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
            Tanlangan davr uchun ma‘lumot mavjud emas
          </div>
        ) : (
          list.map((c, idx) => {
            const amount = Number(c.totalTurnover || 0);
            const fiscal = Number(c.fiscalTurnover || 0);
            const nonFiscal = Number(c.nonFiscalTurnover || 0);
            const totalWidth = Math.max(2, (amount / maxAmount) * 100);
            const fw = amount > 0 ? Math.min(100, (fiscal / amount) * 100) : 0;
            const nw = amount > 0 ? Math.min(100, (nonFiscal / amount) * 100) : 0;
            const share = baseTurnover > 0 ? fmtPercent((amount / baseTurnover) * 100) : '0,0%';

            return (
              <Link
                key={c.companyId || c.tin || idx}
                to={`/platform/analytics/companies/${c.companyId}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '22px minmax(0, 210px) minmax(0, 1fr) 76px 46px',
                  gap: '10px',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: '#1F2937',
                  fontSize: '12.5px',
                }}
              >
                <span style={{ color: '#6B7280', fontWeight: 600 }}>{idx + 1}</span>

                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {sanitizeText(c.name)}
                  </span>
                  {!c.connected && (
                    <span className="badge no" style={{ fontSize: '10.5px', padding: '1px 6px' }}>
                      Ulanmagan
                    </span>
                  )}
                </span>

                <span role="img" aria-label={`${c.name} aylanma`} style={{ display: 'flex', gap: 2, height: 12 }}>
                  <span style={{ width: `${totalWidth}%`, display: 'flex', height: '100%' }}>
                    {fw > 0 && (
                      <span style={{ width: `${fw}%`, minWidth: 3, background: '#2563EB', borderRadius: nw > 0 ? '4px 0 0 4px' : '4px' }} />
                    )}
                    {nw > 0 && (
                      <span style={{ width: `${nw}%`, minWidth: 3, background: '#EA7A2B', borderRadius: fw > 0 ? '0 4px 4px 0' : '4px' }} />
                    )}
                  </span>
                </span>

                <span className="r" style={{ fontWeight: 600 }}>
                  {fmtMoney(amount, { showCurrency: false })}
                </span>

                <span className="r" style={{ color: '#6B7280' }}>
                  {share}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
