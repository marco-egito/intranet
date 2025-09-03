// assets/js/painel-script.js (Versão Final e Completa)

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
    window.auth = auth;
    window.db = db;
    
    window.showToast = function(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.4s ease';
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    const contentArea = document.getElementById('content-area');
    const navButtons = document.querySelectorAll('.nav-button');
    const logoutButton = document.getElementById('logout-button');
    const toggleButton = document.getElementById('sidebar-toggle-btn');
    const mainContainer = document.getElementById('app-view');

    if (toggleButton && mainContainer) {
        toggleButton.addEventListener('click', () => {
            mainContainer.classList.toggle('sidebar-collapsed');
        });
    }

    const initializePage = () => {
        auth.onAuthStateChanged(user => {
            if (!user) {
                window.location.href = '../index.html';
                return;
            }
            // Carrega o dashboard como a primeira tela por padrão
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

    // --- FUNÇÃO loadView ATUALIZADA ---
    async function loadView(viewName) {
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });
        
        const oldScript = document.getElementById('dynamic-view-script');
        if (oldScript) oldScript.remove();
        const oldStyle = document.getElementById('dynamic-view-style');
        if (oldStyle) oldStyle.remove();
        
        try {
            contentArea.innerHTML = '<h2>Carregando...</h2>';
            
            // Lógica genérica que agora funciona para TODAS as views, incluindo o dashboard
            const response = await fetch(`../pages/${viewName}.html`);
            if (!response.ok) {
                throw new Error(`Arquivo não encontrado: ${viewName}.html`);
            }
            contentArea.innerHTML = await response.text();

            // Carrega o CSS específico da view, se existir
            const newStyle = document.createElement('link');
            newStyle.id = 'dynamic-view-style';
            newStyle.rel = 'stylesheet';
            newStyle.href = `../assets/css/${viewName}.css`;
            document.head.appendChild(newStyle);

            // Carrega o JavaScript específico da view, se existir
            const newScript = document.createElement('script');
            newScript.id = 'dynamic-view-script';
            newScript.src = `../assets/js/${viewName}.js`;
            document.body.appendChild(newScript);

        } catch (error) {
            console.error(`Erro ao carregar a view ${viewName}:`, error);
            // Se um arquivo HTML não for encontrado, mostra uma mensagem amigável.
            // Isso evita que a tela fique "Carregando..." para sempre.
            if(error.message.includes('não encontrado')) {
                 contentArea.innerHTML = `<div class="view-container"><h2>Módulo em Desenvolvimento</h2><p>O conteúdo para esta seção ainda não foi criado.</p></div>`;
            } else {
                 contentArea.innerHTML = `<h2>Erro ao carregar este módulo.</h2><p>${error.message}.</p>`;
            }
        }
    }
    
    initializePage();
})();