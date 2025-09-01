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
    const rtdb = firebase.database();

    // --- ELEMENTOS DO DOM ---
    const contentArea = document.getElementById('content-area');
    const navButtons = document.querySelectorAll('.nav-button');
    const logoutButton = document.getElementById('logout-button');

    // --- CONTROLE DE AUTENTICAÇÃO ---
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            document.body.innerHTML = `<div class="view-container" style="text-align:center; padding-top: 50px;"><h2>Acesso Negado</h2><p>Você precisa estar logado. Redirecionando para a página de login...</p></div>`;
            setTimeout(() => { window.location.href = './index.html'; }, 3000);
            return;
        }

        try {
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            if (userDoc.exists && (userDoc.data().funcoes?.includes('admin') || userDoc.data().funcoes?.includes('financeiro'))) {
                // --- CORREÇÃO APLICADA AQUI ---
                // O código que carrega a view inicial foi movido para cá.
                // Isso garante que ele só rode APÓS a confirmação do login e das permissões.
                document.querySelector('.nav-button[data-view="dashboard"]').classList.add('active');
                loadView('dashboard');
            } else {
                document.body.innerHTML = `<div class="view-container" style="text-align:center; padding-top: 50px;"><h2>Acesso Negado</h2><p>Você não tem permissão para acessar esta área.</p></div>`;
                return;
            }
        } catch (error) {
            console.error("Erro ao verificar permissões do usuário:", error);
            document.body.innerHTML = `<div class="view-container" style="text-align:center; padding-top: 50px;"><h2>Erro</h2><p>Ocorreu um erro ao verificar suas permissões. Tente novamente mais tarde.</p></div>`;
        }
    });

    // --- LÓGICA DE NAVEGAÇÃO ---
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const viewName = e.target.dataset.view;
            loadView(viewName);
        });
    });

    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = './index.html';
        });
    });

    // --- FUNÇÃO DE CARREGAMENTO DINÂMICO ---
    async function loadView(viewName) {
        contentArea.innerHTML = '<h2>Carregando...</h2>';
        
        const oldStyleSheet = document.getElementById('module-stylesheet');
        if (oldStyleSheet) {
            oldStyleSheet.remove();
        }

        if (viewName !== 'dashboard') {
            const link = document.createElement('link');
            link.id = 'module-stylesheet';
            link.rel = 'stylesheet';
            link.href = `./assets/css/${viewName}.css`;
            document.head.appendChild(link);
        }

        if (viewName === 'dashboard') {
            renderDashboard();
            return;
        }
        
        try {
            const response = await fetch(`./pages/${viewName}.html`);
            if (!response.ok) throw new Error(`Arquivo não encontrado: ./pages/${viewName}.html`);
            
            contentArea.innerHTML = await response.text();
            
            const scripts = contentArea.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                newScript.textContent = `(function(db, auth, rtdb){ ${script.innerText} })(db, auth, rtdb);`;
                document.body.appendChild(newScript).remove();
            });
        } catch (error) {
            console.error(`Erro ao carregar o módulo ${viewName}:`, error);
            contentArea.innerHTML = '<h2>Erro ao carregar este módulo.</h2><p>Verifique o console para mais detalhes.</p>';
        }
    }
    
    function renderDashboard() {
        contentArea.innerHTML = `
            <div class="view-container">
                <h1>Dashboard Financeiro</h1>
                <p>Bem-vindo ao painel de controle financeiro. Utilize o menu à esquerda para navegar entre as ferramentas.</p>
            </div>
        `;
    }
});
