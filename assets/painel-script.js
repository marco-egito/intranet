// /assets/painel-script.js
document.addEventListener('DOMContentLoaded', function() {
    // --- CONFIGURAÇÃO DO FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyCLeWW39nqxsdv1YD-CNa9RSTv05lGHJxM",
        authDomain: "eupsico-agendamentos-d2048.firebaseapp.com",
        databaseURL: "https://eupsico-agendamentos-d2048-default-rtdb.firebaseio.com",
        projectId: "eupsico-agendamentos-d2048",
        storageBucket: "eupsico-agendamentos-d2048.appspot.com",
        messagingSenderId: "1041518416343",
        appId: "1:1041518416343:web:3b972c212c52a59ad7bb92"
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const rtdb = firebase.database(); // Realtime Database para as grades

    // --- ELEMENTOS DO DOM ---
    const contentArea = document.getElementById('content-area');
    const navButtons = document.querySelectorAll('.nav-button');
    const logoutButton = document.getElementById('logout-button');

    // --- CONTROLE DE AUTENTICAÇÃO ---
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            document.body.innerHTML = `<div style="text-align:center; padding-top: 50px;"><h2>Acesso Negado</h2><p>Você precisa estar logado. Você será redirecionado.</p></div>`;
            // Idealmente, redirecionar para o index.html principal
            setTimeout(() => { window.location.href = './index.html'; }, 3000);
            return;
        }

        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        if (!userDoc.exists || !(userDoc.data().funcoes?.includes('admin') || userDoc.data().funcoes?.includes('financeiro'))) {
            document.body.innerHTML = `<div style="text-align:center; padding-top: 50px;"><h2>Acesso Negado</h2><p>Você não tem permissão para acessar esta área.</p></div>`;
            return;
        }

        // Se o usuário está logado e tem permissão, carrega o dashboard inicial
        loadView('view-dashboard');
    });

    // --- LÓGICA DE NAVEGAÇÃO ---
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            loadView(e.target.dataset.view);
        });
    });

    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => window.close());
    });

    function loadView(viewId) {
        contentArea.innerHTML = '<h2>Carregando...</h2>';
        
        // Aqui, carregamos o HTML e o JS de cada ferramenta
        switch (viewId) {
            case 'view-dashboard':
                renderDashboard();
                break;
            case 'view-profissionais':
                // A função renderProfissionais carregaria o HTML e o JS da gestão de profissionais
                renderProfissionais();
                break;
            // Adicione um 'case' para cada botão do menu
            default:
                contentArea.innerHTML = '<h2>Página não encontrada</h2>';
        }
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO DE CADA MÓDULO ---
    function renderDashboard() {
        contentArea.innerHTML = `
            <div class="view-container">
                <h1>Dashboard Financeiro</h1>
                <p>Bem-vindo ao painel de controle financeiro. Utilize o menu à esquerda para navegar entre as ferramentas.</p>
                </div>
        `;
        // O JavaScript para o dashboard (gráficos, etc.) seria inicializado aqui.
    }

    function renderProfissionais() {
        // Esta função recriaria a sua ferramenta de Gestão de Profissionais
        // 1. Injeta o HTML (tabela, abas, modal)
        contentArea.innerHTML = `
            <div class="view-container">
                <h1>Configurações Gerais do Financeiro</h1>
                <div class="tab">
                    <button class="tablinks active" data-tab="GestaoProfissionais">Gestão de Profissionais</button>
                    </div>
                <div id="GestaoProfissionais" class="tabcontent" style="display:block;">
                    </div>
            </div>
        `;

        // 2. Executa o JavaScript específico da ferramenta
        // (Ex: o código que busca os profissionais do Firestore e popula a tabela, controla o modal, etc.)
        showToast('Módulo de Gestão de Profissionais carregado!', 'success');
    }

    function showToast(message, type = 'success') { /* ...código do toast... */ }

});
