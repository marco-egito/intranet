// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // O servidor de desenvolvimento continua rodando a partir da 'src'
  root: 'src',
  base: '/intranet/',
  publicDir: '../public',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    rollupOptions: {
      // ===== CORREÇÃO DEFINITIVA AQUI =====
      // Os caminhos precisam ser relativos à raiz do projeto (onde o vite.config.js está)
      input: {
        main: 'src/index.html',
        painel: 'src/pages/painel.html'
      }
    }
  }
});