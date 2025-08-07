/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // UFO/space theme colors
        cosmic: {
          50: '#f0f4ff',
          100: '#e0e8ff',
          200: '#c7d6fe',
          300: '#a3bbfc',
          400: '#7c97f8',
          500: '#5b73f2',
          600: '#4c54e8',
          700: '#4144d4',
          800: '#363aab',
          900: '#323687',
        },
        alien: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          'from': { boxShadow: '0 0 5px rgb(34, 197, 94), 0 0 10px rgb(34, 197, 94), 0 0 15px rgb(34, 197, 94)' },
          'to': { boxShadow: '0 0 10px rgb(34, 197, 94), 0 0 20px rgb(34, 197, 94), 0 0 30px rgb(34, 197, 94)' }
        }
      }
    },
  },
  plugins: [],
}