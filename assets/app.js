// /assets/app.js
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

    const appContainer = document.getElementById('app');

    // --- LÓGICA DE AUTENTICAÇÃO E RENDERIZAÇÃO ---
    function handleAuth() {
        appContainer.innerHTML = `<p style="text-align:center; margin-top: 50px;">Verificando autenticação...</p>`;

        auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await db.collection("usuarios").doc(user.uid).get();
                if (userDoc.exists() && userDoc.data().funcoes?.length > 0) {
                    const funcoes = userDoc.data().funcoes;
                    renderDashboard(user, funcoes);
                } else {
                    renderAccessDenied();
                    auth.signOut();
                }
            } else {
                renderLogin();
            }
        });
    }

    function renderLogin(message = "Por favor, faça login para continuar.") {
        appContainer.innerHTML = `
            <div id="login-view" class="content-box" style="text-align: center; max-width: 450px; margin: 50px auto;">
                <img src="./assets/logo-eupsico.png" alt="Logo EuPsico" style="max-width: 300px;"> <h2>Intranet EuPsico</h2>
                <p>${message}</p>
                <button id="login-button">Login com Google</button>
            </div>
        `;
        document.getElementById('login-button').addEventListener('click', () => {
            appContainer.innerHTML = `<p style="text-align:center; margin-top: 50px;">Aguarde...</p>`;
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(error => console.error(error));
        });
    }

    function renderAccessDenied() {
        appContainer.innerHTML = `
            <div class="content-box" style="max-width: 800px; margin: 50px auto; text-align: center;">
                <h2>Acesso Negado</h2>
                <p>Você está autenticado, mas seu usuário não tem permissões definidas. Contate o administrador.</p>
                <button id="denied-logout">Sair</button>
            </div>
        `;
        document.getElementById('denied-logout').addEventListener('click', () => auth.signOut());
    }

    function renderDashboard(user, funcoes) {
        appContainer.innerHTML = `
            <header class="main-header">
                <h1>Intranet EuPsico</h1>
                <div class="user-profile">
                    <img id="user-photo" src="${user.photoURL || ''}" alt="Foto">
                    <span id="user-email">${user.email}</span>
                    <button id="logout-button">Sair</button>
                </div>
            </header>
            <h2 class="modules-title">Módulos da Intranet</h2>
            <div id="nav-links" class="modules-grid"></div>
        `;

        document.getElementById('logout-button').addEventListener('click', () => auth.signOut());
        renderModuleCards(funcoes);
    }

    function renderModuleCards(funcoes) {
        const navLinks = document.getElementById('nav-links');
        if (!navLinks) return;
        navLinks.innerHTML = '';
        const icons = { /* ... Cole aqui o objeto 'icons' completo do seu código anterior ... */ };
        const areas = { /* ... Cole aqui o objeto 'areas' completo do seu código anterior ... */ };
        
        // O resto da lógica da função `renderModuleCards` permanece o mesmo.
        // ...
    }

    // Inicia a aplicação
    handleAuth();
});