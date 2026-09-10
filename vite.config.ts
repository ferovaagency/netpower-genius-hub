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
    rollupOptions: {
      output: {
        // El bundle principal iba en 729 KB sin comprimir, en un solo archivo.
        // Las rutas ya estan en lazy(), asi que ese peso NO son las paginas: es
        // el vendor que entra por App.tsx (React, Router, Query, Helmet, Radix,
        // supabase-js, framer-motion via HomePage) mas Header, Footer y HomePage.
        //
        // Separarlo no baja los bytes de la primera visita, y conviene decirlo
        // claro: baja los de la SEGUNDA en adelante. Hoy cualquier cambio en el
        // codigo del sitio invalida los 729 KB completos, incluido React, que no
        // cambia nunca. Con los vendor aparte, un deploy normal solo invalida el
        // trozo propio.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "vendor-react";
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils")) return "vendor-motion";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("@tanstack")) return "vendor-query";
          return "vendor";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
