// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  base: '/intranet/',
  publicDir: '../public', 
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    rollupOptions: {
      // ADICIONADO: Informa ao Vite sobre as múltiplas páginas
      input: {
        main: resolve(__dirname, 'src/index.html'),
        painel: resolve(__dirname, 'src/pages/painel.html'),
      }
    }
  }
});