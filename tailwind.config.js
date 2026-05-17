/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app.html',
    './pricing.html',
    './privacy.html',
    './terms.html',
    './js/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
