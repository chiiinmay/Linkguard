/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lime:   { DEFAULT: '#C6F135', dark: '#A8D420' },
        cyan:   { DEFAULT: '#00E5FF', dark: '#00B8CC' },
        coral:  { DEFAULT: '#FF5C5C', dark: '#E04040' },
        ink:    { DEFAULT: '#0A0C10', 2: '#111418', 3: '#1A1E26', 4: '#242830' },
        brand:  { muted: '#6B7280', light: '#E8EAED' },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':  'spin 3s linear infinite',
        'fade-up':    'fadeUp 0.5s ease forwards',
        'scan-line':  'scanLine 2s linear infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'none' } },
        scanLine: { '0%': { top: '0%' }, '100%': { top: '100%' } },
      },
      boxShadow: {
        lime:  '0 0 40px rgba(198,241,53,0.3)',
        cyan:  '0 0 40px rgba(0,229,255,0.25)',
        coral: '0 0 40px rgba(255,92,92,0.3)',
        glow:  '0 8px 60px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
