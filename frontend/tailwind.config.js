/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          amber: 'var(--color-brand-amber, #ff9900)',
          hover: 'var(--color-brand-hover, #f08804)',
          navy: 'var(--color-brand-navy, #131921)',
          navylight: 'var(--color-brand-navylight, #232f3e)',
          slate: 'var(--color-brand-slate, #0f1111)',
          darkcard: 'var(--color-brand-darkcard, #1a1f29)',
          darkborder: 'var(--color-brand-darkborder, #2e3846)',
          darkbg: 'var(--color-brand-darkbg, #0f1111)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 15px -3px rgba(255, 153, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
