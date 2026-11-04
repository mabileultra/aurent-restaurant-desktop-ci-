import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function AnalyticsBottomStatsCards() {
  return (
    <div className="an-4bottom-grid" aria-label="Qo‘shimcha tahlil bloklari">
      {/* 1. Eng ko'p o'sgan hududlar */}
      <div className="an-card">
        <h4 className="an-card-title" style={{ fontSize: '0.9rem', marginBottom: '0.85rem' }}>
          Eng ko‘p o‘sgan hududlar
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
              <span>Samarqand viloyati</span>
              <span style={{ color: '#16a34a' }}>↑ 714,5%</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
              +3,68 mlrd · 514,5 mln → 4,19 mlrd
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
              <span>Hududi ko‘rsatilmagan</span>
              <span style={{ color: '#16a34a' }}>↑ 142,0%</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
              +120,4 mln · 84,8 mln → 205,2 mln
            </div>
          </div>
        </div>
      </div>

      {/* 2. Aylanmasi pasaygan hududlar */}
      <div className="an-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <h4 className="an-card-title" style={{ fontSize: '0.9rem' }}>
          Aylanmasi pasaygan hududlar
        </h4>
        <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '999px',
            background: '#ecfdf5',
            color: '#16a34a',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.4rem',
          }}>
            <CheckCircle2 size={18} strokeWidth={2.4} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>Pasaygan hudud yo‘q</div>
          <p style={{ fontSize: '0.73rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Tanlangan davrda barcha faol hududlarda aylanma o‘sgan
          </p>
        </div>
      </div>

      {/* 3. Yangi ulanishlar */}
      <div className="an-card">
        <h4 className="an-card-title" style={{ fontSize: '0.9rem', marginBottom: '0.85rem' }}>
          Yangi ulanishlar
        </h4>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.45rem', height: 60 }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: 2 }}>8</span>
              <div style={{ width: 22, height: 35, background: '#cbd5e1', borderRadius: '3px 3px 0 0' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', display: 'block', marginBottom: 2 }}>12</span>
              <div style={{ width: 22, height: 50, background: '#2563eb', borderRadius: '3px 3px 0 0' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a' }}>+4 ta · ↑ 50%</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
              oldingi davr → joriy davr
            </div>
          </div>
        </div>
      </div>

      {/* 4. Fiskal ulanishdagi xatoliklar */}
      <div className="an-card">
        <h4 className="an-card-title" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Fiskal ulanishdagi xatoliklar
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>0</span>
          <span className="an-badge an-badge--green" style={{ fontSize: '0.75rem' }}>
            ✓ Faol xato yo‘q
          </span>
        </div>
        <p style={{ fontSize: '0.73rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
          Xato paydo bo‘lsa, korxona nomi va xato turi shu yerda ro‘yxat bo‘lib chiqadi
        </p>
      </div>
    </div>
  );
}
