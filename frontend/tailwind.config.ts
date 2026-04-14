import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./features/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./constants.tsx",
  ],
  theme: {
    extend: {
      colors: {
        'islamic-green': '#052e16',
        'cream': '#fdfcf0',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        amiri: ['Amiri', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
