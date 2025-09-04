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

// Garante que o Firebase seja inicializado apenas uma vez
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

(function() {
    // Disponibiliza as instâncias do Firebase globalmente para os scripts das views
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    
    // Função global para exibir notificações
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
    };

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

    function gerenciarPermissoesMenu(funcoesUsuario = []) {
        navButtons.forEach(button => {
            const rolesNecessarias = button.dataset.roles ? button.dataset.roles.split(',') : [];
            const temPermissao = rolesNecessarias.length === 0 || rolesNecessarias.some(role => funcoesUsuario.includes(role.trim()));
            
            if (button.parentElement) {
                button.parentElement.style.display = temPermissao ? 'block' : 'none';
            }
        });
    }

    async function loadView(viewName) {
        // Marca o botão de navegação ativo
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });
        
        // Remove scripts e CSS antigos para evitar conflitos
        const oldScript = document.getElementById('dynamic-view-script');
        if (oldScript) oldScript.remove();
        const oldStyle = document.getElementById('dynamic-view-style');
        if (oldStyle) oldStyle.remove();
        
        try {
            contentArea.innerHTML = '<div class="loading-spinner"></div>';
            
            const response = await fetch(`../pages/${viewName}.html`);
            if (!response.ok) {
                throw new Error(`Arquivo não encontrado: ${viewName}.html`);
            }
            contentArea.innerHTML = await response.text();

            // Tenta carregar o CSS específico da view
            const newStyle = document.createElement('link');
            newStyle.id = 'dynamic-view-style';
            newStyle.rel = 'stylesheet';
            newStyle.href = `../assets/css/${viewName}.css`;
            document.head.appendChild(newStyle);

            // Tenta carregar o JS específico da view
            const newScript = document.createElement('script');
            newScript.id = 'dynamic-view-script';
            newScript.src = `../assets/js/${viewName}.js`;
            document.body.appendChild(newScript);

        } catch (error) {
            console.error(`Erro ao carregar a view ${viewName}:`, error);
            if(error.message.includes('não encontrado')) {
                 contentArea.innerHTML = `<div class="view-container"><h2>Módulo em Desenvolvimento</h2><p>O conteúdo para a seção '${viewName}' ainda não foi criado.</p></div>`;
            } else {
                 contentArea.innerHTML = `<h2>Erro ao carregar este módulo.</h2><p>${error.message}.</p>`;
            }
        }
    }
    
    // Gerencia a navegação via hash na URL
    function handleNavigation() {
        const viewName = window.location.hash.substring(1) || 'dashboard';
        const requestedButton = document.querySelector(`.nav-button[data-view="${viewName}"]`);

        // Verifica se o botão existe e se está visível antes de carregar
        if (requestedButton && requestedButton.parentElement.style.display !== 'none') {
            loadView(viewName);
        } else {
            // Se a view pedida não existe ou o usuário não tem permissão, carrega o dashboard
            window.location.hash = 'dashboard';
            loadView('dashboard');
        }
    }
    
    const initializePage = () => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = '../index.html';
                return;
            }
            try {
                const userDoc = await db.collection('usuarios').doc(user.uid).get();
                if (userDoc.exists) {
                    const funcoes = userDoc.data().funcoes || [];
                    gerenciarPermissoesMenu(funcoes);
                    
                    // A navegação agora é tratada após as permissões serem checadas
                    handleNavigation(); 
                    window.addEventListener('hashchange', handleNavigation);

                } else {
                    document.body.innerHTML = '<h2>Acesso Negado</h2><p>Seu usuário não foi encontrado no sistema.</p>';
                }
            } catch (error) {
                console.error("Erro ao buscar permissões do usuário:", error);
                document.body.innerHTML = '<h2>Ocorreu um erro ao carregar o painel.</h2>';
            }
        });
    };

    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const viewName = e.currentTarget.dataset.view;
            // Apenas muda o hash, o 'hashchange' listener cuida do carregamento
            window.location.hash = viewName;
        });
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = '../index.html';
            });
        });
    }
    
    initializePage();
})();
