// vite.config.js

import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // 1. Aponta para a nova raiz do seu projeto de desenvolvimento.
  // O Vite vai procurar o index.html dentro desta pasta.
  root: 'src',

  build: {
    // 2. Especifica o diretório de saída para o build.
    // O caminho '../dist' significa "volte uma pasta a partir da raiz ('src')
    // e crie a pasta 'dist' lá".
    outDir: '../dist',
    
    // Opcional, mas recomendado: Limpa a pasta 'dist' antes de cada build.
    emptyOutDir: true,
  }
});
