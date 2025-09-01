// vite.config.js

import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: '/intranet/',

  // ADICIONE ESTA LINHA:
  // Isto diz ao Vite para encontrar a pasta 'public'
  // voltando um nível a partir da 'src'.
  publicDir: '../public', 
  
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  }
});