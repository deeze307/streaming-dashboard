/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dashboard-bg': '#0a0a1a',
        'panel-bg': '#12121f',
        'panel-border': '#252538',
        'brand-pink': '#e040fb',
        'brand-cyan': '#00d4ff',
        'youtube': '#ff0000',
        'twitch': '#9146ff',
        'kick': '#53fc18',
      },
    },
  },
  plugins: [],
}