import { getMainAppUrl } from '../../../config/env';

/**
 * Direct login on pharmacy SPA comes later; Sprint 2 points operators to platform login + handoff.
 */
export default function LoginPage() {
  const mainUrl = getMainAppUrl();
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '28rem', background: 'var(--pharm-card)', borderRadius: 12, padding: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.35rem' }}>Aurent Pharmacy</h1>
        <p style={{ margin: 0, color: 'var(--pharm-muted)' }}>
          Войдите на платформе — сессия передаётся одноразовым кодом (без JWT в URL).
        </p>
        <p style={{ margin: '1.25rem 0 0' }}>
          <a href={`${mainUrl}/login`}>Войти на платформе</a>
        </p>
      </div>
    </main>
  );
}
