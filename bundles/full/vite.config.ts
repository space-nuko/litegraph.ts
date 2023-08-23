import { resolve } from 'path';
import { defineConfig } from 'vite';
import checker from "vite-plugin-checker";

export default defineConfig({
    build: {
        outDir: "dist",
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: 'litegraph-ts.full',
            formats: ["es", "umd"],
            fileName: (format) => `litegraph-ts.full.${format}.js`
        },
    },
    plugins: [
        // checker({
        //     typescript: true
        // })
    ]
});
