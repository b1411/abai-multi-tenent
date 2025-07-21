/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'corporate-primary': '#ca181f',
        'corporate-secondary': '#fff',
        'corporate-bg': '#f8fafc',
        'notion-gray': {
          light: '#F7F6F3',
          DEFAULT: '#E6E6E6',
          dark: '#D3D3D3',
        },
        'notion-text': {
          DEFAULT: '#37352F',
          light: '#6B6B6B',
        },
        'event': {
          meeting: '#ca181f',
          task: '#e53e3e',
          reminder: '#9f7aea',
          event: '#ecc94b',
          class: '#ed8936'
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      spacing: {
        'sidebar': '250px',
      },
      boxShadow: {
        'notion': '0 0 0 1px rgba(15, 15, 15, 0.1), 0 2px 4px rgba(15, 15, 15, 0.1)',
        'notion-hover': '0 0 0 1px rgba(15, 15, 15, 0.1), 0 3px 6px rgba(15, 15, 15, 0.15)',
        'calendar-event': '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'wiggle': 'wiggle 0.3s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        }
      },
      minHeight: {
        'widget': '200px',
        'widget-lg': '300px',
      },
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(300px, 1fr))',
        'auto-fill': 'repeat(auto-fill, minmax(300px, 1fr))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
