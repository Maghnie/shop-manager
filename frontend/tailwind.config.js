/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Cairo',
          'Tahoma',
          'Segoe UI',
          'Droid Arabic Naskh',
          'Simplified Arabic',
          'Traditional Arabic',
          'Arial',
          'sans-serif'
        ],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ]
}

