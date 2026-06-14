/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1DB954',
          dark: '#121212',
          gray: '#282828',
          lightgray: '#535353',
          white: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
};
