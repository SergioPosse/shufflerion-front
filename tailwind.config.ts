import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1DB954',
          black: '#121212',
          surface: '#1e1e1e',
          hover: '#2a2a2a',
          muted: '#b3b3b3',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px #1DB954, 0 0 10px #1DB954' },
          '50%': { boxShadow: '0 0 15px #1DB954, 0 0 30px #1DB954' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
