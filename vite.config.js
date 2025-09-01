// vite.config.js
import { defineConfig } from 'vite';

// Não precisamos da biblioteca 'path' nesta versão simplificada
export default defineConfig({
  root: 'src',
  base: '/intranet/',
  publicDir: '../public',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    rollupOptions: {
      // As entradas agora são caminhos relativos simples
      // a partir da pasta 'root' que definimos como 'src'
      input: {
        main: './index.html', // Corresponde a 'src/index.html'
        painel: './pages/painel.html' // Corresponde a 'src/pages/painel.html'
      }
    }
  }
});