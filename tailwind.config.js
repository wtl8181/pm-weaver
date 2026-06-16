/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#090b10',
        panel: '#11151d',
        elevated: '#171c26',
        line: '#273142',
        accent: '#3dd6a6',
        amber: '#f6b44b',
        danger: '#ff6b6b',
      },
      boxShadow: {
        node: '0 14px 35px rgba(0,0,0,0.28)',
      },
    },
  },
  plugins: [],
};
