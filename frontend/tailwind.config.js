/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#064E3B', // Emerald 900
          hover: '#065F46', // Emerald 800
          light: '#D1FAE5', // Emerald 100
        },
        secondary: {
          DEFAULT: '#10B981', // Emerald 500
          hover: '#059669', // Emerald 600
          light: '#A7F3D0', // Emerald 200
        },
        surface: {
          lowest: '#FFFFFF',
          low: '#F8FAFC', // Slate 50
          DEFAULT: '#F1F5F9', // Slate 100
          high: '#E2E8F0', // Slate 200
        },
        text: {
          primary: '#0F172A', // Slate 900
          secondary: '#475569', // Slate 600
          muted: '#94A3B8', // Slate 400
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': 'none',
        'medium': 'none',
      }
    },
  },
  plugins: [],
}
