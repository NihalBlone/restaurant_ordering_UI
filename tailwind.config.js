/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        shell: "#f7f0e4",
        ink: "#182022",
        paprika: "#bf4b2c",
        saffron: "#f2b544",
        olive: "#6b7a42",
        card: "#fffaf2",
        muted: "#6d6d67",
        line: "#e7dbc7",
      },
      boxShadow: {
        lift: "0 24px 40px rgba(24, 32, 34, 0.08)",
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top, rgba(242,181,68,0.34), transparent 32%), radial-gradient(circle at 85% 20%, rgba(191,75,44,0.16), transparent 24%)",
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "float-in": "floatIn 420ms ease-out both",
      },
    },
  },
  plugins: [],
};
