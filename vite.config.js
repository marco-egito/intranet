// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // A opção 'root' foi removida para simplificar.
  
  base: '/intranet/',
  
  build: {
    // A pasta de saída agora é relativa à raiz do projeto.
    outDir: 'docs', 
    emptyOutDir: true,
    rollupOptions: {
      // Especificamos nossas duas páginas de entrada,
      // com caminhos relativos à raiz do projeto.
      input: {
        main: 'src/index.html',
        painel: 'src/pages/painel.html'
      }
    }
  }
});