import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        outDir: "build",
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'litegraph-ts',
            fileName: 'litegraph-ts',
        },
    },
    plugins: [dts()],
});
