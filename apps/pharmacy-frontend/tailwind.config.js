/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand)',
          hover: 'var(--color-brand-hover)',
          soft: 'var(--color-brand-soft)',
        },
      },
      spacing: {
        shell: 'var(--shell-pad)',
      },
    },
  },
  plugins: [],
};
