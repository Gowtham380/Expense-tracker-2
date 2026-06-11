/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Google Product Sans"', 'Inter', 'Poppins', 'sans-serif'],
      },
      colors: {
        neonEmerald: '#10B981',
        neonRose: '#EF4444',
        darkBg: '#050709',
        darkCard: '#0D1117',
      },
    },
  },
  plugins: [],
}
