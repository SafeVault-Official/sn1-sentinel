/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sentinel: {
          bg: '#020617',
          panel: 'rgba(15, 23, 42, 0.55)',
          border: 'rgba(56, 189, 248, 0.3)',
          neon: '#22d3ee',
          green: '#22c55e',
          deep: '#0f172a',
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(34, 211, 238, 0.35)',
        pulse: '0 0 35px rgba(34, 197, 94, 0.4)',
      },
      animation: {
        pulseSlow: 'pulse 2.8s ease-in-out infinite',
        flicker: 'flicker 2.5s linear infinite',
        terminal: 'typing 5s steps(35, end) infinite',
      },
      keyframes: {
        flicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: '1' },
          '20%, 24%, 55%': { opacity: '0.65' },
        },
        typing: {
          '0%': { width: '0%' },
          '45%': { width: '100%' },
          '55%': { width: '100%' },
          '100%': { width: '0%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
