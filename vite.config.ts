import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true,
    open: true,
  },
  optimizeDeps: {
    exclude: ["mongodb"], // Exclude MongoDB from browser bundling
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      external: ["mongodb", "crypto", "util"], // Mark as external for build only
{
  "exclude": ["node_modules", "dist", "build", "api"]
}
    {
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "moduleResolution": "Bundler",
    "types": ["vite/client"]
  },
  "exclude": ["node_modules", "dist", "build", "api"]
}
    },
  },
});
