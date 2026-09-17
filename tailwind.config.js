/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7fd',
          100: '#e1effb',
          200: '#bce0f7',
          300: '#83c4f0',
          400: '#5dade2',
          500: '#3498db', // Tecnishop Classic Blue
          600: '#2980b9', // Classic Hover
          700: '#206694',
          800: '#1d557a',
          900: '#1d4866',
          950: '#132e42',
        },
        navy: {
          700: '#3d566e',
          800: '#34495e', // Classic Primary Gradient End
          900: '#2c3e50', // Classic Primary Gradient Start
          950: '#1a252f', // Classic Dark Sidebar
        },
        slate: {
          850: '#151e2e',
          900: '#0f172a',
          950: '#080c15',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(52, 152, 219, 0.35)',
      }
    },
  },
  plugins: [],
}
