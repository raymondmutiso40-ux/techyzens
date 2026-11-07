/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
