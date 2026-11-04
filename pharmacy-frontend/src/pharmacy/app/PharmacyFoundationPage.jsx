import { getMainAppUrl } from '../../config/env';

const SECTION_LABEL = {
  home: 'Foundation',
  pos: 'POS (скоро)',
  stock: 'Склад (скоро)',
};

/**
 * Sprint 1 placeholder — proves independent SPA + build + deploy path.
 * Real pharmacy modules move here in later sprints; old /pharm on aurent stays until cutover.
 */
export default function PharmacyFoundationPage({ section = 'home' }) {
  const mainUrl = getMainAppUrl();
  const label = SECTION_LABEL[section] || SECTION_LABEL.home;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          maxWidth: '32rem',
          width: '100%',
          background: 'var(--pharm-card)',
          borderRadius: '12px',
          padding: '1.75rem 1.5rem',
        }}
      >
        <p style={{ margin: 0, color: 'var(--pharm-muted)', fontSize: '0.85rem' }}>
          Aurent Pharmacy · p-aurent.uz
        </p>
        <h1 style={{ margin: '0.5rem 0 0.75rem', fontSize: '1.5rem' }}>
          Pharmacy Frontend
        </h1>
        <p style={{ margin: 0, color: 'var(--pharm-muted)' }}>
          Sprint 1 foundation. Секция: <strong style={{ color: 'var(--pharm-fg)' }}>{label}</strong>.
          Модули POS / Stock / ASL переносятся отдельно; на aurent.uz старый
          {' '}
          <code>/pharm</code>
          {' '}
          пока жив.
        </p>
        <p style={{ margin: '1.25rem 0 0' }}>
          <a href={mainUrl}>← Platform (aurent.uz)</a>
        </p>
      </div>
    </main>
  );
}
