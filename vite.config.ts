import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import dsv from '@rollup/plugin-dsv';

export default defineConfig({
    plugins: [devtools(), solidPlugin(), dsv()],
    server: {
        port: 3000,
    },
    build: {
        target: 'esnext',
    },
});
