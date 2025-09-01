// vite.config.js

import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // A raiz do seu código de desenvolvimento
  root: 'src',

  // IMPORTANTE: Adicione esta linha!
  // Isso informa ao Vite que seu site será acessado a partir de /intranet/
  base: '/intranet/',

  build: {
    // Onde a versão final do site será colocada
    outDir: '../dist',
    emptyOutDir: true,
  }
});
