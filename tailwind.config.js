/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1f3a93',
        secondary: '#27ae60',
        bg: '#f4f7f6',
      }
    },
  },
  plugins: [],
}

