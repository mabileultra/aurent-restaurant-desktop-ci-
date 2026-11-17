/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        pos: '1024px',
        'pos-wide': '1280px',
        'pos-compact': { max: '799px' },
        canonical: {
          raw: '(min-width: 1024px) and (max-width: 1280px) and (max-height: 820px)',
        },
      },
      fontFamily: {
        sans: ["'Inter Variable'", "'Inter'", 'system-ui', '-apple-system', "'Segoe UI'", 'sans-serif'],
      },
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-primary-500) / <alpha-value>)',
        },
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        line: {
          DEFAULT: 'rgb(var(--color-line) / <alpha-value>)',
          strong: 'rgb(var(--color-line-strong) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
          disabled: 'rgb(var(--color-ink-disabled) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          soft: 'rgb(var(--color-success-soft) / <alpha-value>)',
          text: 'rgb(var(--color-success-text) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          soft: 'rgb(var(--color-warning-soft) / <alpha-value>)',
          text: 'rgb(var(--color-warning-text) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          soft: 'rgb(var(--color-danger-soft) / <alpha-value>)',
          text: 'rgb(var(--color-danger-text) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          soft: 'rgb(var(--color-info-soft) / <alpha-value>)',
          text: 'rgb(var(--color-info-text) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--color-primary-500) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-600) / <alpha-value>)',
          soft: 'rgb(var(--color-primary-50) / <alpha-value>)',
        },
      },
      borderRadius: {
        card: '14px',
        control: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(20 41 29 / 0.04), 0 4px 16px rgb(20 41 29 / 0.06)',
        elevated: '0 8px 24px rgb(20 41 29 / 0.08)',
      },
      spacing: {
        shell: 'var(--shell-pad)',
      },
    },
  },
  plugins: [],
};
