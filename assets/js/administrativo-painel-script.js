// ATENÇÃO: Este é um novo arquivo de script, exclusivo para o painel administrativo.

// Use a mesma configuração do Firebase do seu outro painel
const firebaseConfig = {
        apiKey: "AIzaSyDJqPJjDDIGo7uRewh3pw1SQZOpMgQJs5M",
        authDomain: "eupsico-agendamentos-d2048.firebaseapp.com",
        databaseURL: "https://eupsico-agendamentos-d2048-default-rtdb.firebaseio.com",
        projectId: "eupsico-agendamentos-d2048",
        storageBucket: "eupsico-agendamentos-d2048.firebasestorage.app",
        messagingSenderId: "1041518416343",
        appId: "1:1041518416343:web:0a11c03c205b802ed7bb92"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    // CORREÇÃO: O ID correto da área de conteúdo neste painel é 'content-area'.
    const contentArea = document.getElementById('content-area');
    const sidebarMenu = document.querySelector('.sidebar-menu');
    const logoutButton = document.getElementById('logout-button');
    let currentUserRoles = [];

    // Função para limpar estilos e scripts de views antigas
    function cleanupPreviousView(viewName) {
        const oldLink = document.querySelector(`link[data-view-style]:not([data-view-style="${viewName}"])`);
        if (oldLink) oldLink.remove();
        
        const oldScript = document.querySelector(`script[data-view-script]:not([data-view-script="${viewName}"])`);
        if (oldScript) oldScript.remove();
    }

    // Função genérica para carregar HTML, CSS e JS de uma view
    async function loadView(viewName) {
        if (!contentArea) return;
        contentArea.innerHTML = '<h2>Carregando...</h2>';

        // Limpa a view anterior antes de carregar a nova
        cleanupPreviousView(viewName);

        const filesToLoad = {};

        // Mapeamento da view para os arquivos corretos
        if (viewName === 'grade_atendimento') {
            filesToLoad.html = './administrativo.html';
            filesToLoad.css = '../assets/css/administrativo.css';
            filesToLoad.js = '../assets/js/administrativo.js';
        }
        // Futuras views administrativas entrarão aqui com outros 'else if'

        try {
            const htmlResponse = await fetch(filesToLoad.html);
            if (!htmlResponse.ok) throw new Error(`Erro ao carregar HTML: ${htmlResponse.statusText}`);
            contentArea.innerHTML = await htmlResponse.text();

            // Carrega o CSS da view dinamicamente, se ainda não estiver carregado
            if (!document.querySelector(`link[data-view-style="${viewName}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = filesToLoad.css;
                link.dataset.viewStyle = viewName;
                document.head.appendChild(link);
            }

            // Carrega o JS da view dinamicamente, se ainda não estiver carregado
            if (!document.querySelector(`script[data-view-script="${viewName}"]`)) {
                const script = document.createElement('script');
                script.src = filesToLoad.js;
                script.dataset.viewScript = viewName;
                document.body.appendChild(script);
            }

        } catch (error) {
            console.error('Erro ao carregar a view:', error);
            contentArea.innerHTML = '<h2>Erro ao carregar a página. Tente novamente.</h2>';
        }
    }

    // Lógica de autenticação e permissões
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDoc = await db.collection("usuarios").doc(user.uid).get();
                if (userDoc.exists) {
                    currentUserRoles = userDoc.data().funcoes || [];
                    updateMenuVisibility();
                    
                    const firstVisibleButton = sidebarMenu.querySelector('button:not([style*="display: none"])');
                    if (firstVisibleButton) {
                        firstVisibleButton.click();
                    } else {
                        contentArea.innerHTML = '<h2>Você não tem permissão para acessar nenhum módulo.</h2>';
                    }
                } else {
                     contentArea.innerHTML = '<h2>Usuário não encontrado no banco de dados.</h2>';
                     setTimeout(() => auth.signOut(), 3000);
                }
            } catch (error) {
                console.error("Erro ao buscar permissões do usuário:", error);
                contentArea.innerHTML = '<h2>Ocorreu um erro ao verificar suas permissões.</h2>';
            }
        } else {
            window.location.href = '../index.html'; // Redireciona para o login se não estiver logado
        }
    });

    function updateMenuVisibility() {
        const buttons = sidebarMenu.querySelectorAll('.nav-button');
        buttons.forEach(button => {
            const requiredRoles = button.dataset.roles.split(',');
            const hasPermission = requiredRoles.some(role => currentUserRoles.includes(role));
            button.style.display = hasPermission ? 'block' : 'none';
        });
    }

    if (sidebarMenu) {
        sidebarMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && !e.target.classList.contains('active')) {
                const view = e.target.dataset.view;
                sidebarMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                loadView(view);
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => auth.signOut());
    }
});
