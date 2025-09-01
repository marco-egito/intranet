// vite.config.js

import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: '/intranet/',
  build: {
    // ALTERAÇÃO CRÍTICA AQUI:
    // Vamos gerar os arquivos na pasta 'docs' em vez de 'dist'.
    outDir: '../docs', 
    
    emptyOutDir: true,
  }
});
