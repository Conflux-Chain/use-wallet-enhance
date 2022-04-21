import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
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
            '@base': path.resolve(__dirname, 'node_modules'),
            '@hooks': path.resolve(__dirname, 'docs/hooks'),
            '@assets': path.resolve(__dirname, 'docs/assets'),
            '@pages': path.resolve(__dirname, 'docs/pages'),
            '@utils': path.resolve(__dirname, 'docs/utils'),
            '@components': path.resolve(__dirname, 'docs/components'),
            '@router': path.resolve(__dirname, 'docs/router'),
            buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
        },
    },
});
