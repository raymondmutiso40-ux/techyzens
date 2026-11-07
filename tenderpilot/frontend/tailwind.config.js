/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dashboard palette: warm orange accent + deep teal for data
        accent: {
          50: '#fff4ed',
          100: '#ffe4d4',
          200: '#ffc6a6',
          400: '#f98a55',
          500: '#f26522',
          600: '#dc5517',
          700: '#b44313',
        },
        deep: {
          50: '#e9f2f4',
          100: '#cfe2e7',
          300: '#7da8b3',
          500: '#1b6576',
          600: '#0f5566',
          700: '#0b4453',
          800: '#08323d',
        },
        canvas: '#f5f6f8',
        brand: {
          50: '#f1f5f9',
          100: '#e2e8f0',
          600: '#1e293b', // calm slate/navy accent
          700: '#0f172a',
          accent: '#2563eb', // single clean accent blue
          accentHover: '#1d4ed8',
        },
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
