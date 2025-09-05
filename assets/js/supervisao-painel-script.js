// assets/js/supervisao-painel-script.js (Versão 1)
const firebaseConfig = {
    // COLE AQUI A SUA CONFIGURAÇÃO DO FIREBASE
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    const cardGridArea = document.getElementById('card-grid-area');
    const viewContentArea = document.getElementById('view-content-area');
    const supervisaoModulesGrid = document.getElementById('supervisao-modules-grid');
    let currentUser = null;
    let currentUserRoles = [];

    const icons = {
        form: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
        list: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`
    };

    window.showSupervisaoDashboard = function() {
        viewContentArea.style.display = 'none';
        viewContentArea.innerHTML = '';
        cardGridArea.style.display = 'block';
    }

    async function loadView(viewName) {
        if (!viewContentArea) return;
        cardGridArea.style.display = 'none';
        viewContentArea.style.display = 'block';
        viewContentArea.innerHTML = '<h2>Carregando...</h2>';
        
        const existingScript = document.querySelector('script[data-view-script]');
        if (existingScript) existingScript.remove();
        
        const filesToLoad = {};
        if (viewName === 'formulario_supervisao') {
            filesToLoad.html = './formulario-supervisao.html';
            filesToLoad.css = '../assets/css/formulario-supervisao.css';
            filesToLoad.js = '../assets/js/formulario-supervisao.js';
        }

        try {
            const htmlResponse = await fetch(filesToLoad.html);
            if (!htmlResponse.ok) throw new Error(`Erro ao carregar HTML: ${htmlResponse.statusText}`);
            viewContentArea.innerHTML = await htmlResponse.text();
            
            const script = document.createElement('script');
            script.src = filesToLoad.js;
            script.dataset.viewScript = viewName;
            document.body.appendChild(script);

        } catch (error) {
            console.error('Erro ao carregar a view:', error);
            viewContentArea.innerHTML = '<h2>Erro ao carregar a página. Tente novamente. <button onclick="showSupervisaoDashboard()">Voltar</button></h2>';
        }
    }

    function renderSupervisaoCards() {
        if (!supervisaoModulesGrid) return;
        supervisaoModulesGrid.innerHTML = '';

        const supervisaoModules = {
            formulario_supervisao: {
                titulo: 'Acompanhamentos',
                descricao: 'Preencha ou visualize os formulários de supervisão.',
                roles: ['admin', 'supervisor', 'assistente'], // Ajuste as roles conforme necessário
                icon: icons.form
            }
            // Futuros cards podem ser adicionados aqui
        };

        for (const key in supervisaoModules) {
            const module = supervisaoModules[key];
            const hasPermission = module.roles.some(role => currentUserRoles.includes(role));

            if (hasPermission) {
                const card = document.createElement('div');
                card.className = 'module-card';
                card.dataset.view = key;
                card.innerHTML = `<div class="card-icon">${module.icon}</div><div class="card-content"><h3>${module.titulo}</h3><p>${module.descricao}</p></div>`;
                supervisaoModulesGrid.appendChild(card);
            }
        }
    }

    supervisaoModulesGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.module-card');
        if (card) {
            loadView(card.dataset.view);
        }
    });

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            try {
                const userDoc = await db.collection("usuarios").doc(user.uid).get();
                if (userDoc.exists) {
                    currentUserRoles = userDoc.data().funcoes || [];
                    renderSupervisaoCards();
                } else {
                    supervisaoModulesGrid.innerHTML = '<h2>Usuário não encontrado.</h2>';
                }
            } catch(error) {
                 supervisaoModulesGrid.innerHTML = '<h2>Erro ao verificar permissões.</h2>';
            }
        } else {
            window.location.href = '../index.html';
        }
    });
});
