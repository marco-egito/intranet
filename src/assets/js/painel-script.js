// src/assets/js/painel-script.js

// Importamos as configurações do nosso novo arquivo de configuração
import { auth, db } from './firebase-config.js';

// --- ELEMENTOS DO DOM ---
const contentArea = document.getElementById('content-area');
const navButtons = document.querySelectorAll('.nav-button');
const logoutButton = document.getElementById('logout-button');

// --- CONTROLE DE AUTENTICAÇÃO ---
const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
};

const initializePage = async () => {
    const user = await getCurrentUser();
    
    if (!user) {
        // Caminho atualizado para o index.html
        window.location.href = '../index.html';
        return;
    }

    try {
        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        if (userDoc.exists && (userDoc.data().funcoes?.includes('admin') || userDoc.data().funcoes?.includes('financeiro'))) {
            loadView('dashboard'); // Carrega a view inicial
        } else {
            document.body.innerHTML = `<div class="view-container"><h2>Acesso Negado</h2><p>Você não tem permissão.</p></div>`;
        }
    } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        document.body.innerHTML = `<div class="view-container"><h2>Erro</h2><p>Ocorreu um erro ao verificar suas permissões.</p></div>`;
    }
};

// --- FUNÇÃO DE CARREGAMENTO DE VIEW (REFEITA) ---
async function loadView(viewName) {
    // Marca o botão de navegação ativo
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    if (viewName === 'dashboard') {
        renderDashboard();
        return;
    }

    try {
        contentArea.innerHTML = '<h2>Carregando...</h2>';
        
        // 1. Carrega o HTML da view
        const response = await fetch(`../pages/${viewName}.html`); // Caminho atualizado
        if (!response.ok) throw new Error(`Arquivo HTML não encontrado.`);
        contentArea.innerHTML = await response.text();

        // 2. Carrega e executa o JavaScript da view dinamicamente
        const modulePath = `./${viewName}.js`;
        // Usamos import() dinâmico, que é a forma moderna de carregar módulos sob demanda
        const viewModule = await import(modulePath);
        
        // Se o módulo exportar uma função 'init', nós a executamos
        if (viewModule && typeof viewModule.init === 'function') {
            viewModule.init(db, auth); // Passamos 'db' e 'auth' para o script da view
        }

    } catch (error) {
        console.error(`Erro ao carregar a view ${viewName}:`, error);
        contentArea.innerHTML = `<h2>Erro ao carregar módulo.</h2><p>${error.message}</p>`;
    }
}

function renderDashboard() {
    contentArea.innerHTML = `
        <div class="view-container">
            <h1>Dashboard Financeiro</h1>
            <p>Bem-vindo ao painel de controle financeiro.</p>
        </div>
    `;
}

// --- EVENT LISTENERS ---
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const viewName = button.dataset.view;
        loadView(viewName);
    });
});

logoutButton.addEventListener('click', () => {
    auth.signOut().then(() => {
        // Caminho atualizado para o index.html
        window.location.href = '../index.html';
    });
});

// Inicia a página
initializePage();
