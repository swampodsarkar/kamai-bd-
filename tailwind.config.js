/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf8e8',
          100: '#f9efc5',
          200: '#f3df8a',
          300: '#edcf4f',
          400: '#e8bf24',
          500: '#d4a817',
          600: '#a88512',
          700: '#8a6e0f',
          800: '#6b550c',
          900: '#4d3e09',
        },
        dark: {
          50: '#f0f0f0',
          100: '#d9d9d9',
          200: '#b3b3b3',
          300: '#8c8c8c',
          400: '#666666',
          500: '#404040',
          600: '#333333',
          700: '#262626',
          800: '#1a1a1a',
          900: '#0f0f0f',
          950: '#080808',
        },
      },
      fontFamily: {
        sans: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
