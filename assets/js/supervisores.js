// assets/js/supervisores.js (Versão 6 - Painel do Supervisor Completo)
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

window.showSupervisorDashboard = function() {
    document.getElementById('view-content-area').style.display = 'none';
    document.getElementById('supervisor-dashboard-content').style.display = 'block';
};

// A função de abrir o modal agora será definida no script da view de perfil
window.openEditModal = null; 

document.addEventListener('DOMContentLoaded', function() {
    if (!auth) return;

    const dashboardContent = document.getElementById('supervisor-dashboard-content');
    const viewContentArea = document.getElementById('view-content-area');
    const supervisorCardsGrid = document.getElementById('supervisor-cards-grid');
    
    const icons = {
        profile: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
        list: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`
    };
    
    async function loadView(viewName) {
        dashboardContent.style.display = 'none';
        viewContentArea.style.display = 'block';
        viewContentArea.innerHTML = '<div class="loading-spinner"></div>';
        
        const fileMap = {
            'meu_perfil': { html: './view-meu-perfil.html', js: '../assets/js/view-meu-perfil.js' },
            'meus_supervisionados': { html: './view-meus-supervisionados.html', js: '../assets/js/view-meus-supervisionados.js' }
        };
        const files = fileMap[viewName];

        try {
            const response = await fetch(files.html);
            viewContentArea.innerHTML = await response.text();
            
            const existingScript = document.querySelector(`script[data-view-script="${viewName}"]`);
            if (existingScript) existingScript.remove();
            
            const script = document.createElement('script');
            script.src = files.js;
            script.dataset.viewScript = viewName;
            document.body.appendChild(script);
        } catch (error) {
            console.error("Erro ao carregar view:", error);
            viewContentArea.innerHTML = `<h2>Erro ao carregar.</h2><button onclick="showSupervisorDashboard()">Voltar</button>`;
        }
    }

    function renderSupervisorCards() {
        supervisorCardsGrid.innerHTML = '';
        const modules = {
            meu_perfil: { titulo: 'Meu Perfil e Edição', descricao: 'Visualize e edite suas informações de perfil.', icon: icons.profile },
            meus_supervisionados: { titulo: 'Meus Supervisionados', descricao: 'Visualize os acompanhamentos que você supervisiona.', icon: icons.list }
        };
        for(const key in modules) {
            const module = modules[key];
            const card = document.createElement('div');
            card.className = 'module-card';
            card.dataset.view = key;
            card.innerHTML = `<div class="card-icon">${module.icon}</div><div class="card-content"><h3>${module.titulo}</h3><p>${module.descricao}</p></div>`;
            supervisorCardsGrid.appendChild(card);
        }
    }
    
    supervisorCardsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.module-card');
        if (card) {
            loadView(card.dataset.view);
        }
    });

    auth.onAuthStateChanged(async user => {
        if (user) {
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().funcoes?.includes('supervisor')) {
                renderSupervisorCards();
            } else {
                dashboardContent.innerHTML = '<h2>Acesso Negado</h2><p>Esta área é exclusiva para supervisores.</p>';
            }
        } else {
            window.location.href = '../index.html';
        }
    });
});
