// main.js
import { handleAuth } from './src/js/auth.js';

// Inicia o fluxo da aplicação
document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app');
    handleAuth(appContainer);
});