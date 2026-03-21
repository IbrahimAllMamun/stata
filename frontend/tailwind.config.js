/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'md': '752px',   // was 768px — matches your 752px requirement
        'lg': '1020px',  // was 1024px — matches your 1020px requirement
      },
    },
  },
  plugins: [],
};