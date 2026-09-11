import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  build: {
    chunkSizeWarningLimit: 1500,
    // Sin manualChunks: el split manual de vendors provocaba un error de
    // inicializacion ("Cannot access 'se' before initialization") por
    // dependencias circulares entre chunks, y la pagina quedaba en blanco
    // en produccion. Rollup hace un split seguro por su cuenta.
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
