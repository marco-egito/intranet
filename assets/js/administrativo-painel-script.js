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
    const contentArea = document.getElementById('content-area');
    const sidebarMenu = document.querySelector('.sidebar-menu');
    const logoutButton = document.getElementById('logout-button');
    let currentUserRoles = [];

    function cleanupPreviousView(viewName) {
        const oldLink = document.querySelector(`link[data-view-style]:not([data-view-style="${viewName}"])`);
        if (oldLink) oldLink.remove();
        
        const oldScript = document.querySelector(`script[data-view-script]:not([data-view-script="${viewName}"])`);
        if (oldScript) oldScript.remove();
    }

    async function loadView(viewName) {
        if (!contentArea || !viewName) return; // Adicionada verificação para viewName
        contentArea.innerHTML = '<h2>Carregando...</h2>';
        cleanupPreviousView(viewName);
        const filesToLoad = {};
        if (viewName === 'grade_atendimento') {
            filesToLoad.html = './administrativo.html';
            filesToLoad.css = '../assets/css/administrativo.css';
            filesToLoad.js = '../assets/js/administrativo.js';
        }
        try {
            const htmlResponse = await fetch(filesToLoad.html);
            if (!htmlResponse.ok) throw new Error(`Erro ao carregar HTML: ${htmlResponse.statusText}`);
            contentArea.innerHTML = await htmlResponse.text();
            
            if (!document.querySelector(`link[data-view-style="${viewName}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = filesToLoad.css;
                link.dataset.viewStyle = viewName;
                document.head.appendChild(link);
            }
            
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

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDoc = await db.collection("usuarios").doc(user.uid).get();
                if (userDoc.exists) {
                    currentUserRoles = userDoc.data().funcoes || [];
                    updateMenuVisibility();
                    
                    // -------- BLOCO DE CÓDIGO CORRIGIDO ABAIXO --------
                    const firstVisibleButton = sidebarMenu.querySelector('button:not([style*="display: none"])');
                    if (firstVisibleButton) {
                        // CORREÇÃO: Em vez de simular um clique, chamamos a função diretamente.
                        const initialView = firstVisibleButton.dataset.view;
                        firstVisibleButton.classList.add('active'); // Ativa o botão manualmente
                        loadView(initialView); // Carrega a view diretamente
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
            window.location.href = '../index.html';
        }
    });
    
    function updateMenuVisibility() {
        const buttons = sidebarMenu.querySelectorAll('.nav-button');
        buttons.forEach(button => {
            const requiredRoles = button.dataset.roles.split(',').map(role => role.trim());
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
