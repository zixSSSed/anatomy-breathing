import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// На GitHub Pages сайт живёт в /anatomy-breathing/. Для другого адреса: BASE=/ npm run build
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  base: command === "build" || isPreview ? process.env.BASE || "/anatomy-breathing/" : "/",
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: { three: ["three"], react: ["react", "react-dom"], motion: ["motion"] },
      },
    },
  },
}));
