/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sf-purple': '#6B46C1',
        'sf-pink': '#EC4899',
        'damage-high': '#EF4444',
        'damage-medium': '#F59E0B',
        'damage-low': '#10B981',
      },
    },
  },
  plugins: [],
}