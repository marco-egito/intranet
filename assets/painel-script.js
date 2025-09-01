<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configurações Gerais - EuPsico</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; margin: 0; padding: 15px; }
        .container { max-width: 1200px; margin: 0 auto; background-color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
        h1 { text-align: center; color: #004a7f; padding: 20px 0; margin: 0; }
        .tab { overflow: hidden; border-bottom: 1px solid #ccc; background-color: #f1f1f1; }
        .tab button { background-color: inherit; float: left; border: none; outline: none; cursor: pointer; padding: 14px 16px; transition: 0.3s; font-size: 17px; font-weight: bold; color: #555; }
        .tab button:hover { background-color: #ddd; }
        .tab button.active { background-color: #004a7f; color: white; }
        .tabcontent { display: none; padding: 20px; border-top: none; animation: fadeEffect 0.5s; }
        @keyframes fadeEffect { from {opacity: 0;} to {opacity: 1;} }
        .form-group { margin-bottom: 15px; }
        label { display: block; font-weight: bold; margin-bottom: 5px; color: #555; }
        input[type="text"], input[type="email"], input[type="number"], textarea { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; font-size: 1em; }
        input[type="checkbox"] { transform: scale(1.2); margin-right: 5px; }
        input:disabled { background-color: #e9ecef; cursor: not-allowed; }
        .checkbox-group label { display: inline-flex; align-items: center; margin-right: 15px; font-weight: normal; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: middle; }
        thead th { background-color: #e9ecef; }
        .action-button { border: none; padding: 8px 12px; font-size: 0.9em; font-weight: bold; border-radius: 5px; cursor: pointer; color: white; margin-right: 5px; }
        .save-btn { background-color: #28a745; float: right; padding: 10px 20px; font-size: 1em; }
        .add-row-btn { background-color: #007bff; }
        .delete-row-btn { background-color: #dc3545; }
        .edit-row-btn { background-color: #ffc107; color: #212529; }
        .save-row-btn { background-color: #28a745; }
        .button-bar { margin-bottom: 20px; overflow: hidden; }
        .button-bar .add-row-btn { float: left; }
        .actions-confirm-delete span { margin-right: 10px; font-weight: bold; color: #333; }
        .confirm-delete-yes-btn { background-color: #dc3545; }
        .cancel-delete-btn { background-color: #6c757d; }
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5); }
        .modal-content { background-color: #fefefe; margin: 10% auto; padding: 25px; border: 1px solid #888; width: 90%; max-width: 500px; border-radius: 8px; }
        .modal-header h2 { margin: 0; color: #004a7f; }
        .modal-footer { padding-top: 15px; border-top: 1px solid #eee; text-align: right; }
        #toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 2000; }
        .toast { background-color: #333; color: white; padding: 15px 20px; border-radius: 5px; margin-top: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); opacity: 0; transform: translateX(100%); transition: all 0.4s ease; }
        .toast.show { opacity: 1; transform: translateX(0); }
        .toast.toast-success { background-color: #28a745; }
        .toast.toast-error { background-color: #dc3545; }
    </style>
</head>
<body>
    // /assets/painel-script.js
document.addEventListener('DOMContentLoaded', function() {
    // --- CONFIGURAÇÃO DO FIREBASE ---
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
    const rtdb = firebase.database();

    // --- ELEMENTOS DO DOM (Serão buscados depois que o painel for renderizado) ---
    let contentArea, navButtons, logoutButton;
    
    // --- LÓGICA DE AUTENTICAÇÃO ATUALIZADA ---
    function initializePanel() {
        // Exibe uma mensagem de carregamento inicial
        document.body.innerHTML = `<div style="text-align:center; padding: 50px;"><h2>Carregando Painel...</h2></div>`;
        
        let authStateResolved = false;

        // Define um tempo máximo de espera. Se o Firebase não responder, o usuário não está logado.
        const authTimeout = setTimeout(() => {
            if (!authStateResolved) {
                renderAccessDenied("Você precisa estar logado. Redirecionando...");
                setTimeout(() => { window.location.href = './index.html'; }, 2500);
            }
        }, 6000); // Espera até 6 segundos

        auth.onAuthStateChanged(async (user) => {
            authStateResolved = true;
            clearTimeout(authTimeout); // Cancela o timeout, pois o Firebase respondeu.

            if (user) {
                try {
                    const userDoc = await db.collection('usuarios').doc(user.uid).get();
                    if (userDoc.exists && (userDoc.data().funcoes?.includes('admin') || userDoc.data().funcoes?.includes('financeiro'))) {
                        // Usuário logado e com permissão: renderiza a "casca" do painel
                        renderPanelShell();
                        loadView('dashboard');
                    } else {
                        renderAccessDenied("Você não tem permissão para acessar esta área.");
                    }
                } catch (error) {
                    console.error("Erro ao verificar permissões:", error);
                    renderAccessDenied("Ocorreu um erro ao verificar suas permissões.");
                }
            } else {
                // Se o Firebase respondeu e o usuário é nulo, ele definitivamente não está logado.
                renderAccessDenied("Você precisa estar logado. Redirecionando...");
                setTimeout(() => { window.location.href = './index.html'; }, 2500);
            }
        });
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO E NAVEGAÇÃO ---
    function renderPanelShell() {
        document.body.innerHTML = `
            <div id="toast-container"></div>
            <div id="app-view" class="main-container">
                <nav class="sidebar">
                    <div class="sidebar-header"><h2>Financeiro</h2></div>
                    <ul class="sidebar-menu">
                        <li><button class="nav-button" data-view="dashboard">Dashboard</button></li>
                        <li><button class="nav-button" data-view="gestao_profissionais">Gestão de Profissionais</button></li>
                        </ul>
                    <div class="sidebar-footer"><button id="logout-button">Sair</button></div>
                </nav>
                <main class="content"><div id="content-area"></div></main>
            </div>
        `;
        
        // Reatribui as variáveis do DOM e adiciona os listeners após o painel ser desenhado
        contentArea = document.getElementById('content-area');
        navButtons = document.querySelectorAll('.nav-button');
        logoutButton = document.getElementById('logout-button');

        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const viewName = e.target.dataset.view;
                loadView(viewName);
            });
        });

        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => { window.location.href = './index.html'; });
        });
    }

    async function loadView(viewName) {
        // Atualiza o estado visual do menu
        navButtons.forEach(btn => {
            if (btn.dataset.view === viewName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

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
            contentArea.innerHTML = `<h2>Erro ao carregar este módulo.</h2><p>${error.message}. Verifique se o arquivo existe na pasta /pages e se o nome em data-view no painel.html está correto.</p>`;
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

    // --- INICIA A APLICAÇÃO ---
    initializePanel();
});
    </script>
</body>
</html>
