import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
    plugins: [solidPlugin()],
    test: {
        environment: 'happy-dom',
        deps: {
            optimizer: {
                web: {
                    include: ['solid-js'],
                },
            },
        },
        isolate: false,
    },
    resolve: {
        conditions: ['development', 'browser'],
    },
});
