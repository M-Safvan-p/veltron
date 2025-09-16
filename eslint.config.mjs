import js from "@eslint/js";
import globals from "globals"; // 👈 import instead of require
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["src/**/*.{js,mjs,cjs}", "migrations/**/*.js"], // only backend + migrations
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      sourceType: "commonjs", // Node.js project
      globals: {
        ...globals.node, // 👈 now works in ESM
      },
    },
  },
]);
