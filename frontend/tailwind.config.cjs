module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#f5c518",
        bg:    { 900: "#0f1215", 800: "#1b1f24", 700: "#232931" },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")()],
};
