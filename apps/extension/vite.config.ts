import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "index.html"),
        options: path.resolve(__dirname, "options.html")
      }
    }
  },
  resolve: {
    alias: {
      "@healthstory/core": path.resolve(__dirname, "../../packages/core/src")
    }
  }
});
