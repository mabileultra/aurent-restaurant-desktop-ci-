import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { fmtDeltaBadge, fmtMoney, fmtNum } from '../utils/analyticsFormat';

export default function AnalyticsBottomStatsCards({
  growingRegions = [],
  decliningRegions = [],
  kpi,
}) {
  const newConnections = Number(kpi?.newConnections || 0);
  const newConnDelta = fmtDeltaBadge(kpi?.newConnectionsDeltaPct);
  const errors = Number(kpi?.connectionErrors || 0);

  const topGrowing = growingRegions.slice(0, 2);
  const topDeclining = decliningRegions.slice(0, 2);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
      {/* 1. Eng ko'p o'sgan hududlar */}
      <section className="card" aria-labelledby="gr" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 id="gr" className="t" style={{ fontSize: '14px' }}>Eng ko‘p o‘sgan hududlar</h2>
        {topGrowing.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#6B7280', margin: 'auto 0' }}>O‘sgan hudud qayd etilmadi</div>
        ) : (
          topGrowing.map((r) => {
            const delta = fmtDeltaBadge(r.turnoverDeltaPct);
            return (
              <div key={r.code || r.nameUz}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '13px' }}>
                  <span>{r.nameUz || r.nameRu}</span>
                  <span className={delta.dir}>{delta.text}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                  Aylanma: {fmtMoney(r.totalTurnover)} · {r.enterprises || 0} korxona
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* 2. Aylanmasi pasaygan hududlar */}
      <section className="card" aria-labelledby="dc" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 id="dc" className="t" style={{ fontSize: '14px' }}>Aylanmasi pasaygan hududlar</h2>
        {topDeclining.length === 0 ? (
          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '6px', padding: '6px 0' }}>
            <span style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#E7F6EE',
              color: '#16A36A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Check className="ic" style={{ width: 18, height: 18 }} />
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Pasaygan hudud yo‘q</span>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              Tanlangan davrda barcha faol hududlarda aylanma barqaror
            </span>
          </div>
        ) : (
          topDeclining.map((r) => {
            const delta = fmtDeltaBadge(r.turnoverDeltaPct);
            return (
              <div key={r.code || r.nameUz}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '13px' }}>
                  <span>{r.nameUz || r.nameRu}</span>
                  <span className={delta.dir}>{delta.text}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                  Aylanma: {fmtMoney(r.totalTurnover)} · {r.enterprises || 0} korxona
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* 3. Yangi ulanishlar */}
      <section className="card" aria-labelledby="nw" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 id="nw" className="t" style={{ fontSize: '14px' }}>Yangi ulanishlar</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', minHeight: '64px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#1F2937' }}>
            {fmtNum(newConnections)}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>
            <span className={newConnDelta.dir} style={{ fontWeight: 600 }}>
              {newConnDelta.text}
            </span>
            <br />
            oldingi davrga nisbatan
          </div>
        </div>
      </section>

      {/* 4. Fiskal ulanishdagi xatoliklar */}
      <section className="card" aria-labelledby="er" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 id="er" className="t" style={{ fontSize: '14px' }}>Fiskal ulanishdagi xatoliklar</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="v">{fmtNum(errors)}</span>
          {errors === 0 ? (
            <span className="badge ok">
              <Check className="ic" style={{ width: 13, height: 13 }} />
              Faol xato yo‘q
            </span>
          ) : (
            <span className="badge no">
              <AlertTriangle className="ic" style={{ width: 13, height: 13 }} />
              {errors} ta xato
            </span>
          )}
        </div>
        <span style={{ fontSize: '12px', color: '#6B7280' }}>
          {errors === 0 ? 'Barcha kassa apparatlari fiskal modulga muvaffaqiyatli ulangan' : 'Ba‘zi kassalarda ulanish uzilgan'}
        </span>
      </section>
    </div>
  );
}
