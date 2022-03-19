import react from '@vitejs/plugin-react';
import ts2 from 'rollup-plugin-typescript2';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
    plugins: [
        react(),
        {
            ...ts2({
                check: true,
                tsconfig: './tsconfig.json',
                tsconfigOverride: {
                    compilerOptions: {
                        sourceMap: false,
                        declaration: true,
                        declarationMap: false,
                    },
                },
            }),
            enforce: 'pre',
        },
    ],
    optimizeDeps: {
        esbuildOptions: {
            // Node.js global to browser globalThis
            define: {
                global: 'globalThis',
            },
            // Enable esbuild polyfill plugins
            plugins: [NodeGlobalsPolyfillPlugin({ buffer: true, process: true }), NodeModulesPolyfillPlugin()],
        },
    },
    resolve: {
        alias: {
            buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
        },
    },
    build: {
        target: 'es6',
        lib: {
            entry: 'src/index.ts',
            fileName: () => 'index.js',
            formats: ['es'],
        },
        rollupOptions: {
            plugins: [visualizer()],
            external: ['react', 'react-dom', '@cfxjs/use-wallet', '@cfxjs/use-wallet/dist/ethereum', 'decimal.js', 'js-conflux-sdk', "@fluent-wallet/account", "@fluent-wallet/base32-address"],
        },
    },
});
