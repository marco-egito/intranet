// ATENÇÃO: Este é um novo arquivo de script, exclusivo para o painel administrativo.

// Use a mesma configuração do Firebase do seu outro painel
const firebaseConfig = {
    // COLE AQUI A CONFIGURAÇÃO DO SEU FIREBASE
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    const contentArea = document.getElementById('content-area');
    const sidebarMenu = document.querySelector('.sidebar-menu');
    const logoutButton = document.getElementById('logout-button');
    let currentUserRoles = [];

    // Função genérica para carregar HTML, CSS e JS de uma view
    async function loadView(viewName) {
        if (!contentArea) return;
        contentArea.innerHTML = '<h2>Carregando...</h2>';

        const filesToLoad = {};

        if (viewName === 'grade_atendimento') {
            filesToLoad.html = './administrativo.html'; // O arquivo que já criamos
            filesToLoad.css = '../assets/css/administrativo.css'; // O arquivo que já criamos
            filesToLoad.js = '../assets/js/administrativo.js'; // O arquivo que já criamos
        }
        // Futuras views administrativas entrarão aqui com outros 'else if'

        try {
            const htmlResponse = await fetch(filesToLoad.html);
            if (!htmlResponse.ok) throw new Error(`Erro ao carregar HTML: ${htmlResponse.statusText}`);
            contentArea.innerHTML = await htmlResponse.text();

            // Carrega o CSS da view dinamicamente
            const head = document.head;
            const existingLink = document.querySelector(`link[data-view-style="${viewName}"]`);
            if (existingLink) existingLink.remove(); // Remove o estilo da view anterior
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = filesToLoad.css;
            link.dataset.viewStyle = viewName;
            head.appendChild(link);

            // Carrega o JS da view dinamicamente
            const existingScript = document.querySelector(`script[data-view-script="${viewName}"]`);
            if (existingScript) existingScript.remove(); // Remove o script da view anterior
            const script = document.createElement('script');
            script.src = filesToLoad.js;
            script.dataset.viewScript = viewName;
            document.body.appendChild(script);

        } catch (error) {
            console.error('Erro ao carregar a view:', error);
            contentArea.innerHTML = '<h2>Erro ao carregar a página. Tente novamente.</h2>';
        }
    }

    // Lógica de autenticação e permissões
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDoc = await db.collection("usuarios").doc(user.uid).get();
                if (userDoc.exists) {
                    currentUserRoles = userDoc.data().funcoes || [];
                    updateMenuVisibility();
                    // Carrega a primeira view disponível por padrão
                    const firstVisibleButton = sidebarMenu.querySelector('button:not([style*="display: none"])');
                    if (firstVisibleButton) {
                        firstVisibleButton.click();
                    } else {
                        contentArea.innerHTML = '<h2>Você não tem permissão para acessar nenhum módulo.</h2>';
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar permissões do usuário:", error);
            }
        } else {
            window.location.href = '../index.html'; // Redireciona para o login se não estiver logado
        }
    });

    function updateMenuVisibility() {
        const buttons = sidebarMenu.querySelectorAll('.nav-button');
        buttons.forEach(button => {
            const requiredRoles = button.dataset.roles.split(',');
            const hasPermission = requiredRoles.some(role => currentUserRoles.includes(role));
            button.style.display = hasPermission ? 'block' : 'none';
        });
    }

    if (sidebarMenu) {
        sidebarMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const view = e.target.dataset.view;
                loadView(view);
                sidebarMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => auth.signOut());
    }
});
