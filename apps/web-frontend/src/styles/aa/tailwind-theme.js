// Aurent Admin — Tailwind 3 uchun theme.extend qo‘shimchasi. Manba: docs/design-system/tokens.json.
// Hamma kalitlar «aa» nomi ostida — mavjud `brand`, `shell` va Tailwind standart kalitlariga tegmaydi.
export const aaTheme = {
  colors: {
    aa: {
      'canvas': 'var(--aa-canvas)',
      'surface': 'var(--aa-surface)',
      'surface-sunken': 'var(--aa-surface-sunken)',
      'surface-hover': 'var(--aa-surface-hover)',
      'line': 'var(--aa-line)',
      'line-strong': 'var(--aa-line-strong)',
      'ink': 'var(--aa-ink)',
      'ink-muted': 'var(--aa-ink-muted)',
      'ink-subtle': 'var(--aa-ink-subtle)',
      'brand': 'var(--aa-brand)',
      'brand-hover': 'var(--aa-brand-hover)',
      'brand-soft': 'var(--aa-brand-soft)',
      'on-brand': 'var(--aa-on-brand)',
      'analytics': 'var(--aa-analytics)',
      'analytics-hover': 'var(--aa-analytics-hover)',
      'analytics-soft': 'var(--aa-analytics-soft)',
      'on-analytics': 'var(--aa-on-analytics)',
      'success': 'var(--aa-success)',
      'success-soft': 'var(--aa-success-soft)',
      'warning': 'var(--aa-warning)',
      'warning-soft': 'var(--aa-warning-soft)',
      'danger': 'var(--aa-danger)',
      'danger-soft': 'var(--aa-danger-soft)',
      'info': 'var(--aa-info)',
      'info-soft': 'var(--aa-info-soft)',
      'focus': 'var(--aa-focus)',
      'chart-track': 'var(--aa-chart-track)',
      'scrim': 'var(--aa-scrim)'
    }
  },
  borderRadius: {
    'aa-sm': 'var(--aa-radius-sm)',
    'aa-md': 'var(--aa-radius-md)',
    'aa-lg': 'var(--aa-radius-lg)',
    'aa-xl': 'var(--aa-radius-xl)',
    'aa-full': 'var(--aa-radius-full)'
  },
  boxShadow: {
    'aa-pop': 'var(--aa-shadow-pop)',
    'aa-modal': 'var(--aa-shadow-modal)'
  },
  fontFamily: {
    'aa-sans': 'var(--aa-font-sans)',
    'aa-mono': 'var(--aa-font-mono)'
  },
  fontSize: {
    'aa-page-title': ['26px', { lineHeight: '32px', fontWeight: '700', letterSpacing: '-0.01em' }],
    'aa-section-title': ['18px', { lineHeight: '26px', fontWeight: '600' }],
    'aa-card-title': ['15px', { lineHeight: '22px', fontWeight: '600' }],
    'aa-body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
    'aa-body-strong': ['14px', { lineHeight: '20px', fontWeight: '600' }],
    'aa-small': ['13px', { lineHeight: '18px', fontWeight: '400' }],
    'aa-label': ['12px', { lineHeight: '16px', fontWeight: '600' }],
    'aa-metric-lg': ['30px', { lineHeight: '36px', fontWeight: '700', letterSpacing: '-0.01em' }],
    'aa-metric': ['22px', { lineHeight: '28px', fontWeight: '700' }],
    'aa-mono': ['13px', { lineHeight: '18px', fontWeight: '400' }]
  },
  height: {
    'aa-control-sm': 'var(--aa-control-sm)',
    'aa-control-md': 'var(--aa-control-md)',
    'aa-control-lg': 'var(--aa-control-lg)',
    'aa-row': 'var(--aa-row-height)'
  },
  width: {
    'aa-sidebar': 'var(--aa-sidebar-width)'
  },
  maxWidth: {
    'aa-content': 'var(--aa-content-max)'
  }
};
