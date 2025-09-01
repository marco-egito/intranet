// /assets/painel-script.js
document.addEventListener('DOMContentLoaded', function() {
    // --- CONFIGURAÇÃO DO FIREBASE ---
    const firebaseConfig = {  
        apiKey: "AIzaSyCLeWW39nqxsdv1YD-CNa9RSTv05lGHJxM",
          authDomain: "eupsico-agendamentos-d2048.firebaseapp.com",
          databaseURL: "https://eupsico-agendamentos-d2048-default-rtdb.firebaseio.com",
          projectId: "eupsico-agendamentos-d2048",
          storageBucket: "eupsico-agendamentos-d2048.firebasestorage.app",
          messagingSenderId: "1041518416343",
          appId: "1:1041518416343:web:3a0abc73404ccd51d7bb92" 
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
            // ... (código de acesso negado e redirecionamento)
            return;
        }
        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        if (!userDoc.exists || !(userDoc.data().funcoes?.includes('admin') || userDoc.data().funcoes?.includes('financeiro'))) {
            // ... (código de acesso negado por falta de permissão)
            return;
        }
        
        loadPage('dashboard_financeiro'); // Carrega a página inicial
    });

    // --- LÓGICA DE NAVEGAÇÃO E CARREGAMENTO DE PÁGINA ---
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const pageName = e.target.dataset.page;
            loadPage(pageName);
        });
    });

    logoutButton.addEventListener('click', () => { /* ... código de logout ... */ });

    async function loadPage(pageName) {
        contentArea.innerHTML = '<h2>Carregando...</h2>';
        try {
            const response = await fetch(`./pages/${pageName}.html`);
            if (!response.ok) throw new Error('Página não encontrada.');
            
            const htmlContent = await response.text();
            contentArea.innerHTML = htmlContent;
            
            // Executa os scripts da página carregada
            const scripts = contentArea.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                newScript.text = script.innerText;
                document.body.appendChild(newScript).parentNode.removeChild(newScript);
            });

        } catch (error) {
            console.error(`Erro ao carregar a página ${pageName}:`, error);
            contentArea.innerHTML = '<h2>Erro ao carregar o módulo.</h2>';
        }
    }
});
