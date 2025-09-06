// assets/js/supervisao-painel-script.js (Versão 1)
const firebaseConfig = {
    apiKey: "AIzaSyDJqPJjDDIGo7uRewh3pw1SQZOpMgQJs5M",
  authDomain: "eupsico-agendamentos-d2048.firebaseapp.com",
  databaseURL: "https://eupsico-agendamentos-d2048-default-rtdb.firebaseio.com",
  projectId: "eupsico-agendamentos-d2048",
  storageBucket: "eupsico-agendamentos-d2048.firebasestorage.app",
  messagingSenderId: "1041518416343",
  appId: "1:1041518416343:web:0a11c03c205b802ed7bb92"
};
// Evita reinicialização se já estiver carregado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    const cardGridArea = document.getElementById('card-grid-area');
    const viewContentArea = document.getElementById('view-content-area');
    const supervisaoModulesGrid = document.getElementById('supervisao-modules-grid');
    let currentUserData = null; // Armazena os dados do usuário logado

    // --- INÍCIO DA CORREÇÃO ---
    // Tornamos a função GLOBAL, associando-a ao objeto 'window'.
    // Assim, o HTML carregado dinamicamente (onclick="...") consegue encontrá-la.
    window.showSupervisaoDashboard = function() {
        if (viewContentArea) {
            viewContentArea.style.display = 'none';
            viewContentArea.innerHTML = '';
        }
        if (cardGridArea) {
            cardGridArea.style.display = 'block';
        }
    }
    // --- FIM DA CORREÇÃO ---

    async function loadView(viewName, mode = 'list') {
        if (!viewContentArea || !cardGridArea) return;

        cardGridArea.style.display = 'none';
        viewContentArea.style.display = 'block';
        viewContentArea.innerHTML = '<div class="loading-spinner"></div>'; // Feedback visual

        // Remove o script antigo para evitar execuções múltiplas
        const existingScript = document.querySelector('script[data-view-script="formulario-supervisao"]');
        if (existingScript) existingScript.remove();

        try {
            const htmlResponse = await fetch('./formulario-supervisao.html');
            if (!htmlResponse.ok) throw new Error(`Erro ao carregar HTML: ${htmlResponse.statusText}`);
            viewContentArea.innerHTML = await htmlResponse.text();

            // Passa o modo ('new' ou 'list') para o script do formulário através de uma variável global
            window.formSupervisaoMode = mode;

            // Adiciona o CSS do formulário se ainda não existir
            if (!document.querySelector(`link[data-view-style="formulario-supervisao"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '../assets/css/formulario-supervisao.css';
                link.dataset.viewStyle = 'formulario-supervisao';
                document.head.appendChild(link);
            }

            // Cria e anexa o script da view dinamicamente
            const script = document.createElement('script');
            script.src = '../assets/js/formulario-supervisao.js';
            script.dataset.viewScript = 'formulario-supervisao';
            document.body.appendChild(script);

        } catch (error) {
            console.error('Erro ao carregar a view:', error);
            viewContentArea.innerHTML = `<h2>Ocorreu um erro.</h2><p>Tente novamente mais tarde.</p><button onclick="showSupervisaoDashboard()">Voltar</button>`;
        }
    }

    function renderSupervisaoCards() {
        if (!supervisaoModulesGrid) return;
        supervisaoModulesGrid.innerHTML = '';

        const supervisaoModules = {
            nova_ficha: {
                titulo: 'Ficha de Supervisão',
                descricao: 'Clique aqui para preencher uma nova ficha.',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>'
            },
            visualizar: {
                titulo: 'Acompanhamentos',
                descricao: 'Visualize todas as fichas que você preencheu ou supervisionou.',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>'
            }
        };

        // Lógica de permissão simplificada: se o usuário tem dados, ele pode ver os módulos.
        if (currentUserData) {
            for (const key in supervisaoModules) {
                const module = supervisaoModules[key];
                const card = document.createElement('div');
                card.className = 'module-card';
                card.dataset.view = 'formulario_supervisao'; // Ambos os cards carregam a mesma view-base
                card.dataset.mode = key === 'nova_ficha' ? 'new' : 'list';
                card.innerHTML = `<div class="card-icon">${module.icon}</div><div class="card-content"><h3>${module.titulo}</h3><p>${module.descricao}</p></div>`;
                supervisaoModulesGrid.appendChild(card);
            }
        } else {
             supervisaoModulesGrid.innerHTML = '<h2>Não foi possível verificar suas permissões.</h2>';
        }
    }

    supervisaoModulesGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.module-card');
        if (card) {
            loadView(card.dataset.view, card.dataset.mode);
        }
    });

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDoc = await db.collection("usuarios").doc(user.uid).get();
                if (userDoc.exists) {
                    currentUserData = userDoc.data(); // Salva todos os dados do usuário
                    renderSupervisaoCards();
                } else {
                    supervisaoModulesGrid.innerHTML = '<h2>Usuário não encontrado no banco de dados.</h2>';
                }
            } catch(error) {
                console.error("Erro ao buscar dados do usuário:", error);
                supervisaoModulesGrid.innerHTML = '<h2>Erro ao verificar permissões. Tente recarregar a página.</h2>';
            }
        } else {
            // Se não houver usuário, redireciona para a página de login
            window.location.href = '../index.html';
        }
    });
});
