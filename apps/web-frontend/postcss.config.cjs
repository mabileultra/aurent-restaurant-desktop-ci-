const path = require('node:path');

/** Vite + PostCSS: Tailwind обрабатывает @tailwind в src/index.css */
module.exports = {
  plugins: {
    tailwindcss: {
      config: path.resolve(__dirname, 'tailwind.config.js'),
    },
    autoprefixer: {},
  },
};

