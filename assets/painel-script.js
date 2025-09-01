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

    // --- ELEMENTOS GLOBAIS DO PAINEL ---
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

        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        if (!userDoc.exists || !(userDoc.data().funcoes?.includes('admin') || userDoc.data().funcoes?.includes('financeiro'))) {
            document.body.innerHTML = `<div class="view-container" style="text-align:center; padding-top: 50px;"><h2>Acesso Negado</h2><p>Você não tem permissão para acessar esta área.</p></div>`;
            return;
        }
        
        // Se o usuário está logado e tem permissão, carrega a view inicial (Dashboard)
        loadView('dashboard'); 
    });

    // --- LÓGICA DE NAVEGAÇÃO E CARREGAMENTO DE PÁGINAS ---
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const viewName = e.target.dataset.view; // Pega o nome da view do atributo data-view
            loadView(viewName);
        });
    });

    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = './index.html';
        });
    });

    /**
     * Carrega o conteúdo de um módulo na área principal.
     * @param {string} viewName O nome da view a ser carregada (ex: 'gestao_profissionais').
     */
    async function loadView(viewName) {
        contentArea.innerHTML = '<h2>Carregando...</h2>';

        // O Dashboard é um caso especial, pois seu conteúdo é simples e pode ficar aqui.
        if (viewName === 'dashboard') {
            renderDashboard();
            return;
        }

        try {
            // Para todos os outros módulos, busca o arquivo HTML correspondente na pasta /pages/
            const response = await fetch(`./pages/${viewName}.html`);
            if (!response.ok) {
                throw new Error(`Arquivo não encontrado: ${viewName}.html`);
            }
            
            const htmlContent = await response.text();
            contentArea.innerHTML = htmlContent;
            
            // Procura e executa qualquer tag <script> dentro do HTML que foi carregado
            const scripts = contentArea.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                // Garante que o escopo das variáveis (db, auth, etc.) esteja disponível
                // para os scripts dos módulos.
                newScript.textContent = `(function(db, auth, rtdb) { ${script.innerText} })(db, auth, rtdb);`;
                document.body.appendChild(newScript).parentNode.removeChild(newScript);
            });

        } catch (error) {
            console.error(`Erro ao carregar o módulo ${viewName}:`, error);
            contentArea.innerHTML = '<h2>Erro ao carregar este módulo.</h2><p>Verifique o console para mais detalhes.</p>';
        }
    }
    
    // --- FUNÇÕES DE RENDERIZAÇÃO DE MÓDULOS ESPECÍFICOS (APENAS OS SIMPLES) ---

    function renderDashboard() {
        contentArea.innerHTML = `
            <div class="view-container">
                <h1>Dashboard Financeiro</h1>
                <p>Bem-vindo ao painel de controle financeiro. Utilize o menu à esquerda para navegar entre as ferramentas.</p>
                </div>
        `;
    }

    // A função renderProfissionais() foi removida daqui, pois agora seu código
    // está totalmente contido dentro de /pages/gestao_profissionais.html
});
