import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
    build: {
        outDir: "dist",
        sourcemap: true,
        rollupOptions: {
            input: {
                background: resolve(__dirname, "src/background.ts"),
                content: resolve(__dirname, "src/content.ts"),
                options: resolve(__dirname, "options.html")
            },
            output: {
                entryFileNames: (chunk) => {
                    // keeps predictable names used by manifest.json
                    return `assets/${chunk.name}.js`;
                },
                chunkFileNames: "assets/chunk-[hash].js",
                assetFileNames: "assets/[name][extname]"
            }
        }
    },
    publicDir: "public"
});
