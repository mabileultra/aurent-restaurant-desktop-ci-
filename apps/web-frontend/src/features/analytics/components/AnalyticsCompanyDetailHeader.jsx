import React from 'react';
import { ArrowLeft, CheckCircle2, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const PERIODS = [
  { key: '7d', label: '7 kun' },
  { key: '30d', label: '30 kun' },
  { key: 'month', label: 'Oy' },
  { key: 'year', label: 'Yil' },
];

export default function AnalyticsCompanyDetailHeader({
  company,
  loading = false,
  period,
  setPeriod,
  onExport,
}) {
  if (loading || !company) {
    return (
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/platform/analytics/companies"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#2563EB',
            textDecoration: 'none',
            marginBottom: '0.75rem',
          }}
        >
          <ArrowLeft size={16} aria-hidden />
          <span>Firmalar ro‘yxatiga</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="an-skeleton" style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.65rem', background: '#e2e8f0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="an-skeleton" style={{ width: '200px', height: '24px', borderRadius: '4px', background: '#e2e8f0' }} />
            <div className="an-skeleton" style={{ width: '260px', height: '14px', borderRadius: '4px', background: '#e2e8f0' }} />
          </div>
        </div>
      </div>
    );
  }

  const initials = (company.name || 'FI').slice(0, 2).toUpperCase();
  const region = company.regionNameUz || company.regionNameRu || 'Hududi ko‘rsatilmagan';
  const rank = company.rank ? ` · Aylanma bo‘yicha ${company.rank}-o‘rin` : '';

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <Link
        to="/platform/analytics/companies"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#2563EB',
          textDecoration: 'none',
          marginBottom: '0.75rem',
        }}
      >
        <ArrowLeft size={16} aria-hidden />
        <span>Firmalar ro‘yxatiga</span>
      </Link>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '0.65rem',
              background: '#eff6ff',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {company.name}
              </h1>
              {company.connected !== false ? (
                <span className="an-badge an-badge--blue" style={{ fontSize: '0.75rem' }}>
                  <CheckCircle2 size={13} aria-hidden />
                  <span>Fiskal tizimga ulangan</span>
                </span>
              ) : (
                <span className="an-badge an-badge--red" style={{ fontSize: '0.75rem' }}>
                  Ulanmagan
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              STIR {company.tin || '—'} · {region} · {company.storeCount || 1} do‘kon{rank}
            </p>
          </div>
        </div>

        <div className="an-actions">
          <div className="an-period-group">
            {PERIODS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`an-period-btn${period === item.key ? ' is-active' : ''}`}
                onClick={() => setPeriod(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {onExport ? (
            <button type="button" className="an-export-btn" onClick={onExport}>
              <Download size={14} aria-hidden />
              <span>Excel</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
