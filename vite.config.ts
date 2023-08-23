import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, "lib/litegraph.js"),
            name: "litegraph-ts",
            // the proper extensions will be added
            fileName: "litegraph",
        },
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
});
