/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // LoudEcho production design language (dara-front)
        brand: '#0090FF',          // accent blue — active states, links, progress
        'brand-text': '#0072cc',   // blue legible on white
        dark: '#110c22',           // high-emphasis text / dark surfaces
        accent: '#7357ff',         // purple — secondary accent, draft states
        'med-em': '#4f4b5c',       // medium-emphasis text
        'low-em': '#8d8a95',       // low-emphasis text
        line: '#e2e4eb',           // default borders
        'line-soft': '#ececed',    // lighter borders
        success: '#0baa60',
        'success-bg': '#e2fcf0',
        fail: '#cf2a2a',
        draft: '#6347f4',
        'draft-bg': '#f1eeff',
        'info-bg': '#e9f4ff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
