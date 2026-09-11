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
    // NO volver a meter `manualChunks` aqui sin probar el build antes.
    //
    // El 10 sep 2026 se intento separar los vendor (React, Router, Query, Radix,
    // Supabase, framer-motion) en chunks propios. El build paso sin error, pero
    // en produccion la SPA no monto: el navegador lanzaba
    //   ReferenceError: Cannot access 'se' before initialization
    // en vendor-*.js, y la pagina se quedaba mostrando solo el bloque estatico
    // del prerender. Es el fallo clasico de orden de inicializacion: al repartir
    // el grafo en chunks, uno queda evaluandose antes que la dependencia que
    // necesita en tiempo de modulo. Rollup hace un split seguro por su cuenta.
    //
    // Separar el bundle sigue siendo deseable, pero exige comprobarlo con
    // `npm run build` y abrir el `dist` servido, no solo ver que compile.
    chunkSizeWarningLimit: 1500,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
