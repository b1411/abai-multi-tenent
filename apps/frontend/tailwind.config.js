/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ca181f',
        secondary: '#f5f5f5',
      },
    },
  },
  plugins: [],
}
