/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
    build: {
        outDir: 'build',
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react' || 'redux' || 'bootstrap' || 'styled-components' || 'reconnecting-websocket')) {
                            return 'view';
                        }
                        if (id.includes('@inrupt' || 'rdf' || 'uuid' || 'buffer')) {
                            return 'solid';
                        }
                        return 'vendor';
                    }
                }
            }
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        coverage: {
            reporter: ['text'],
            exclude: [
                'node_modules/',
                'src/setupTests.ts',
                '**/*.test.ts'
            ],
        },
    },
    server: {
        open: true,
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            }
        }
    }
});