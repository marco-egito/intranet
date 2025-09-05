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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    const cardGridArea = document.getElementById('card-grid-area');
    const viewContentArea = document.getElementById('view-content-area');
    const supervisaoModulesGrid = document.getElementById('supervisao-modules-grid');
    let currentUserRoles = [];

    const icons = {
        form: `<svg></svg>`,
        list: `<svg></svg>`
    };

    window.showSupervisaoDashboard = function() {
        viewContentArea.style.display = 'none';
        viewContentArea.innerHTML = '';
        cardGridArea.style.display = 'block';
    }

    async function loadView(viewName, mode = 'list') {
        if (!viewContentArea) return;
        cardGridArea.style.display = 'none';
        viewContentArea.style.display = 'block';
        viewContentArea.innerHTML = '<h2>Carregando...</h2>';
        
        const existingScript = document.querySelector('script[data-view-script]');
        if (existingScript) existingScript.remove();
        
        try {
            const htmlResponse = await fetch('./formulario-supervisao.html');
            if (!htmlResponse.ok) throw new Error(`Erro ao carregar HTML`);
            viewContentArea.innerHTML = await htmlResponse.text();
            
            // Passa o modo ('new' ou 'list') para o script do formulário
            window.formSupervisaoMode = mode; 

            if (!document.querySelector(`link[data-view-style="formulario-supervisao"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '../assets/css/formulario-supervisao.css';
                link.dataset.viewStyle = 'formulario-supervisao';
                document.head.appendChild(link);
            }
            
            const script = document.createElement('script');
            script.src = '../assets/js/formulario-supervisao.js';
            script.dataset.viewScript = 'formulario-supervisao';
            document.body.appendChild(script);

        } catch (error) {
            console.error('Erro ao carregar a view:', error);
            viewContentArea.innerHTML = `<h2>Erro ao carregar a página. Tente novamente. <button onclick="showSupervisaoDashboard()">Voltar</button></h2>`;
        }
    }

    function renderSupervisaoCards() {
        if (!supervisaoModulesGrid) return;
        supervisaoModulesGrid.innerHTML = '';

        const supervisaoModules = {
            nova_ficha: {
                titulo: 'Ficha de Supervisão',
                descricao: 'Clique aqui para preencher uma nova ficha.',
                roles: ['admin', 'supervisor', 'psicologo', 'psicopedagogo', 'musicoterapeuta'], // Quem pode criar fichas
                icon: icons.form,
                mode: 'new'
            },
            visualizar: {
                titulo: 'Acompanhamentos',
                descricao: 'Visualize todas as fichas que você preencheu ou supervisionou.',
                roles: ['admin', 'supervisor', 'psicologo', 'psicopedagogo', 'musicoterapeuta'], // Quem pode ver fichas
                icon: icons.list,
                mode: 'list'
            }
        };

        for (const key in supervisaoModules) {
            const module = supervisaoModules[key];
            const hasPermission = module.roles.some(role => currentUserRoles.includes(role));
            if (hasPermission) {
                const card = document.createElement('div');
                card.className = 'module-card';
                card.dataset.view = key;
                card.dataset.mode = module.mode;
                card.innerHTML = `<div class="card-icon">${module.icon}</div><div class="card-content"><h3>${module.titulo}</h3><p>${module.descricao}</p></div>`;
                supervisaoModulesGrid.appendChild(card);
            }
        }
    }

    supervisaoModulesGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.module-card');
        if (card) {
            loadView('formulario_supervisao', card.dataset.mode);
        }
    });

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDoc = await db.collection("usuarios").doc(user.uid).get();
                if (userDoc.exists) {
                    currentUserRoles = userDoc.data().funcoes || [];
                    renderSupervisaoCards();
                }
            } catch(error) {
                 supervisaoModulesGrid.innerHTML = '<h2>Erro ao verificar permissões.</h2>';
            }
        } else {
            window.location.href = '../index.html';
        }
    });
});
