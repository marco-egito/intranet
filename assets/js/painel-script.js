
// assets/js/painel-script.js

// 1. Adicionamos a configuração do Firebase, igual à do app.js
const firebaseConfig = {
    apiKey: "AIzaSyDJqPJjDDIGo7uRewh3pw1SQZOpMgQJs5M",
    authDomain: "eupsico-agendamentos-d2048.firebaseapp.com",
    databaseURL: "https://eupsico-agendamentos-d2048-default-rtdb.firebaseio.com",
    projectId: "eupsico-agendamentos-d2048",
    storageBucket: "eupsico-agendamentos-d2048.firebasestorage.app",
    messagingSenderId: "1041518416343",
    appId: "1:1041518416343:web:0a11c03c205b802ed7bb92"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

(function() {
    const auth = firebase.auth();
    const db = firebase.firestore();
    const rtdb = firebase.database();

    window.auth = auth;
    window.db = db;
    window.rtdb = rtdb;

    const contentArea = document.getElementById('content-area');
    const navButtons = document.querySelectorAll('.nav-button');
    const logoutButton = document.getElementById('logout-button');

    // --- LÓGICA DO MENU RETRÁTIL ---
    const toggleButton = document.getElementById('sidebar-toggle-btn');
    const mainContainer = document.getElementById('app-view');

    if (toggleButton && mainContainer) {
        toggleButton.addEventListener('click', () => {
            mainContainer.classList.toggle('sidebar-collapsed');
        });
    }
    // --- FIM DA LÓGICA DO MENU ---

    const initializePage = () => {
        auth.onAuthStateChanged(user => {
            if (!user) {
                window.location.href = '../index.html';
                return;
            }
            loadView('dashboard');
        });
    };

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewName = button.dataset.view;
            loadView(viewName);
        });
    });

    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = '../index.html';
        });
    });

    async function loadView(viewName) {
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });
        
        const oldScript = document.getElementById('dynamic-view-script');
        if (oldScript) oldScript.remove();
        const oldStyle = document.getElementById('dynamic-view-style');
        if (oldStyle) oldStyle.remove();

        if (viewName === 'dashboard') {
            renderDashboard();
            return;
        }
        
        try {
            contentArea.innerHTML = '<h2>Carregando...</h2>';
            
            const response = await fetch(`../pages/${viewName}.html`);
            if (!response.ok) {
                 // Lança um erro personalizado para ser pego pelo catch
                throw new Error(`Arquivo não encontrado: ${viewName}.html`);
            }
            contentArea.innerHTML = await response.text();

            const newStyle = document.createElement('link');
            newStyle.id = 'dynamic-view-style';
            newStyle.rel = 'stylesheet';
            newStyle.href = `../assets/css/${viewName}.css`;
            document.head.appendChild(newStyle);

            const newScript = document.createElement('script');
            newScript.id = 'dynamic-view-script';
            newScript.src = `../assets/js/${viewName}.js`;
            document.body.appendChild(newScript);

        } catch (error) {
            console.error(`Erro ao carregar a view ${viewName}:`, error);
            contentArea.innerHTML = `<h2>Erro ao carregar este módulo.</h2><p>${error.message}.</p>`;
        }
    }
    
    function renderDashboard() {
        contentArea.innerHTML = `
            <div class="view-container">
                <h1>Dashboard Financeiro</h1>
                <p>Bem-vindo ao painel de controle financeiro. Utilize o menu à esquerda para navegar entre as ferramentas.</p>
            </div>
        `;
    }
    
    initializePage();
})();
