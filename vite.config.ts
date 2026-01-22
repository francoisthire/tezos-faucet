import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import pkgJson from "./package.json";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const isDevelopment = (mode: string) => mode === "development";

export default defineConfig(async ({ mode }) => ({
  build: {
    outDir: "build",
    sourcemap: isDevelopment(mode) || "hidden",
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes("node_modules") ? "vendor" : null),
      },
      external: ["virtual:terminal"],
    },
  },

  esbuild: {
    supported: {
      "top-level-await": true,
    },
  },

  plugins: [
    // Polyfill Node core modules for browser builds (fixes url/http/crypto/etc.)
    nodePolyfills({
      protocolImports: true, // handles node:crypto / node:url, etc.
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),

    react(),

    ...[
      isDevelopment(mode) &&
      (await import("vite-plugin-terminal")).default({
        output: ["terminal", "console"],
      }),
    ],
  ],

  define: {
    global: "globalThis",
    "import.meta.env.APP_DESCRIPTION": JSON.stringify(pkgJson.description),
    "import.meta.env.APP_VERSION": JSON.stringify(pkgJson.version),
  },
}));
