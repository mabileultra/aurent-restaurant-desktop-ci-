import React from 'react';
import { Link } from 'react-router-dom';

export default function AnalyticsTopRegionsCard() {
  return (
    <div className="an-card" aria-label="TOP hududlar">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Aylanma bo‘yicha TOP hududlar</h3>
          <p className="an-card-sub">Bosilsa hudud → tuman → korxona</p>
        </div>

        <Link
          to="/platform/analytics/regions"
          style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}
        >
          Hududlar ›
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Samarqand viloyati */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>1 Samarqand viloyati</span>
            <strong style={{ fontSize: '0.95rem' }}>4,19 mlrd</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem' }}>
            63 korxona · 16 ulangan
          </div>
          <div style={{ width: '100%', height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '95.3%', background: '#2563eb', height: '100%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', fontSize: '0.72rem', marginTop: '0.25rem' }}>
            <span style={{ color: '#64748b' }}>95,3% ulush</span>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>· ↑ 714,5%</span>
          </div>
        </div>

        {/* Hududi ko'rsatilmagan */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>2 Hududi ko‘rsatilmagan</span>
            <strong style={{ fontSize: '0.95rem' }}>205,2 mln</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem' }}>
            49 korxona · 15 ulangan
          </div>
          <div style={{ width: '100%', height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '4.7%', background: '#2563eb', height: '100%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', fontSize: '0.72rem', marginTop: '0.25rem' }}>
            <span style={{ color: '#64748b' }}>4,7% ulush</span>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>· ↑ 142,0%</span>
          </div>
        </div>

        {/* Toshkent viloyati */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.35rem 0', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ color: '#64748b' }}>3 Toshkent viloyati</span>
          <span style={{ color: '#94a3b8' }}>0 · 1 korxona</span>
        </div>

        {/* Toshkent shahri */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.35rem 0', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ color: '#64748b' }}>4 Toshkent shahri</span>
          <span style={{ color: '#94a3b8' }}>0 · 1 korxona</span>
        </div>
      </div>

      <div style={{
        marginTop: '0.75rem',
        padding: '0.55rem 0.85rem',
        background: '#f8fafc',
        borderRadius: '0.55rem',
        fontSize: '0.75rem',
        color: '#64748b',
        textAlign: 'center',
      }}>
        Qolgan 11 ta hududda hali korxona yo‘q
      </div>
    </div>
  );
}
