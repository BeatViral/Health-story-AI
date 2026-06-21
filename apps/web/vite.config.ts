import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  root: __dirname,
  base: process.env.GITHUB_PAGES_BASE || "/",
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "HealthStory AI",
        short_name: "HealthStory",
        description: "A private local-first health journal for body signals and doctor-ready summaries.",
        theme_color: "#155E63",
        background_color: "#FAFAF7",
        display: "standalone",
        start_url: ".",
        icons: [
          { src: "brand/logo-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
          { src: "brand/generated/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "brand/generated/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "brand/generated/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"]
      }
    })
  ],
  resolve: {
    alias: {
      "@healthstory/core": path.resolve(__dirname, "../../packages/core/src"),
      "@healthstory/ui": path.resolve(__dirname, "../../packages/ui/src")
    }
  }
});
