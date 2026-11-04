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
  period,
  setPeriod,
  onExport,
}) {
  const initials = (company?.name || 'FI').slice(0, 2).toUpperCase();

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
          color: '#047857',
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
              background: '#ecfdf5',
              color: '#047857',
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
                {company?.name || 'Farina Invest'}
              </h1>
              {company?.connected !== false ? (
                <span className="an-badge an-badge--green" style={{ fontSize: '0.75rem' }}>
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
              STIR {company?.tin || '303190578'} · {company?.regionNameUz || company?.regionNameRu || 'Samarqand viloyati, Samarqand sh.'} · {company?.storeCount || 1} do‘kon · Aylanma bo‘yicha 1-o‘rin / 114
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
