/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neonEmerald: '#10b981',
        neonRose: '#f43f5e',
        darkBg: '#0f172a',
        darkCard: '#1e293b',
      },
    },
  },
  plugins: [],
}
