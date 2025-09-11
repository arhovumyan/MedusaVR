/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    { pattern: /bg-(blue|green|purple|yellow|indigo|pink|gray|red|teal|orange)-(500|600|700|900)/ },
    { pattern: /text-(blue|green|purple|yellow|indigo|pink|gray|red|teal|orange)-(400)/ },
    { pattern: /border-(blue|green|purple|yellow|indigo|pink|gray|red|teal|orange)-(500|600|700)/ },
    { pattern: /hover:bg-(blue|green|purple|yellow|indigo|pink|gray|red|teal|orange)-(600|700)/ },
    { pattern: /hover:border-(blue|green|purple|yellow|indigo|pink|gray|red|teal|orange)-(500)/ },
  ],
};