/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00d4aa',
          dark: '#00b894',
        },
        background: {
          DEFAULT: '#0a0a0a',
          card: '#1a1a1a',
        },
      },
    },
  },
  plugins: [],
};
