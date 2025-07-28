// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",           // Include the root index.html
    "./src/**/*.{js,jsx,ts,tsx}", // Scan all JS/JSX files in src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};