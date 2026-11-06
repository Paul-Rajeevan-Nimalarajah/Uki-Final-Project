/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1E40AF',
          teal: '#0D9488',
          purple: '#7C3AED',
          yellow: '#F59E0B',
          surface: '#F8FAFC'
        }
      }
    },
  },
  plugins: [],
}

