import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const devServerLogger = () => ({
  name: "dev-server-logger",
  configureServer(server: any) {
    server.httpServer?.once("listening", () => {
      const origin = "dev-server";
      const urls = (server as any).resolvedUrls;

      console.info("[Dev][Vite] Dev server is running.");
      console.info("[Dev][Vite] Current browser origin:", origin);

      if (urls?.local?.length || urls?.network?.length) {
        (urls.local || []).forEach((url: string) =>
          console.info("[Dev][Vite] Local URL:", url)
        );
        (urls.network || []).forEach((url: string) =>
          console.info("[Dev][Vite] Network URL:", url)
        );
      } else {
        console.info(
          "[Dev][Vite] Host/port:",
          server.config.server.host,
          server.config.server.port
        );
      }
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isLowMemory =
    process.env.CODESPACES === "true" || process.env.VITE_LOW_MEMORY === "true";

const baseBuild = {
    minify: false,
    sourcemap: false,
    cssMinify: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 2000,
    // Force a single JS bundle to avoid React initialization / chunk order issues
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        // Fixed filenames for custom domain serving (serve-funnel expects these exact paths)
        entryFileNames: 'assets/index.js',
        assetFileNames: (assetInfo: { name?: string }) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/index.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  } as const;

  const lowMemoryBuild = {
    ...baseBuild,
  };

  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
      strictPort: false,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      mode === "development" && devServerLogger(),
    ].filter(Boolean),
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: isLowMemory ? lowMemoryBuild : baseBuild,
  };
});
