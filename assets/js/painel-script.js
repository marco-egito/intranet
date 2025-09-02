
// --- INÍCIO DA CORREÇÃO ---

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

// 2. Inicializamos o Firebase ANTES de qualquer outra coisa
// A verificação 'firebase.apps.length' garante que a inicialização só aconteça uma vez.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// --- FIM DA CORREÇÃO ---
// Envolvemos todo o código em uma função para não poluir o escopo global
(function() {

    const auth = firebase.auth();
    const db = firebase.firestore();
    const rtdb = firebase.database();

    // Disponibiliza as variáveis para os scripts carregados dinamicamente
    window.auth = auth;
    window.db = db;
    window.rtdb = rtdb;

    // --- ELEMENTOS DO DOM ---
    const contentArea = document.getElementById('content-area');
    const navButtons = document.querySelectorAll('.nav-button');
    const logoutButton = document.getElementById('logout-button');

    // --- CONTROLE DE AUTENTICAÇÃO ---
    const initializePage = async () => {
        auth.onAuthStateChanged(user => {
            if (!user) {
                // Se não houver usuário, redireciona para a página inicial
                window.location.href = '../index.html';
                return;
            }
            // Se o usuário estiver logado, carrega o dashboard inicial
            loadView('dashboard');
        });
    };

    // --- LÓGICA DE NAVEGAÇÃO ---
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

    // --- FUNÇÃO DE CARREGAMENTO DINÂMICO (MODIFICADA) ---
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
            
            // 1. Carrega o HTML da view (caminho relativo a partir de 'pages/painel.html')
            const response = await fetch(`../pages/${viewName}.html`);
            if (!response.ok) throw new Error(`Arquivo não encontrado: ${viewName}.html`);
            contentArea.innerHTML = await response.text();

            // 2. Carrega o JavaScript da view dinamicamente (MÉTODO MODIFICADO)
            // Remove o script antigo para evitar duplicatas
            const oldScript = document.getElementById('dynamic-view-script');
            if (oldScript) {
                oldScript.remove();
            }

            // Cria e anexa a nova tag de script
            const newScript = document.createElement('script');
            newScript.id = 'dynamic-view-script';
            // O caminho precisa voltar de 'pages/' para a raiz, e então entrar em 'assets/js/'
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
        // Remove qualquer script de view dinâmico se voltarmos para o dashboard
        const oldScript = document.getElementById('dynamic-view-script');
        if (oldScript) {
            oldScript.remove();
        }
    }
    
    // Inicia a verificação de autenticação da página
    initializePage();
})();
