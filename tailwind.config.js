/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'forest-green': {
          DEFAULT: '#2D5016',
          50: '#8BC460',
          100: '#7FBD51',
          200: '#68AA39',
          300: '#537C32',
          400: '#40602A',
          500: '#2D5016',
          600: '#1F3A0F',
          700: '#0F1D07',
          800: '#000000',
          900: '#000000',
          950: '#000000'
        },
        cream: '#FDFBF7',
        charcoal: '#2A2A2A'
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}

