/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['BeFit Slim', 'Noto Emoji', 'sans-serif'],
      },
      colors: {
        'brand-green': '#00A86B',
      }
    },
  },
  plugins: [],
}
