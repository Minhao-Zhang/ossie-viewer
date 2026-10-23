import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { viteSingleFile } from "vite-plugin-singlefile";

// One self-contained index.html: a module script loaded from file:// is blocked by browsers.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
