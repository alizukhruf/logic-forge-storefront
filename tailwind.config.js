/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1f6fb',
          100: '#dce9f5',
          200: '#c2d7e9',
          500: '#3977ad',
          600: '#2b6395',
          700: '#205184',
          800: '#163b68',
          900: '#102c50',
          950: '#081b36',
        },
      },
    },
  },
  plugins: [],
};
