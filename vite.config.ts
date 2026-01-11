
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      https: true,
    },
    base: '/cabina/',
    plugins: [
      react(),
      basicSsl(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png'],
        manifest: {
          name: 'Creativa Labs — Cabina de Fotos',
          short_name: 'Creativa Cabina',
          description: 'Experiencia Digital de Alquimia Visual',
          theme_color: '#050505',
          background_color: '#050505',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/cabina/',
          icons: [
            {
              src: 'favicon.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'favicon.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'favicon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
