// /src/js/dashboard.js
import { getAuth, signOut } from "firebase/auth";

export function loadDashboard(appContainer, user, funcoes) {
    // Carrega o HTML do dashboard
    fetch('/src/pages/dashboard.html')
        .then(response => response.text())
        .then(html => {
            appContainer.innerHTML = html;

            // Preenche os dados do usuário
            document.getElementById('user-photo').src = user.photoURL || '';
            document.getElementById('user-email').textContent = user.email;
            
            // Lógica para renderizar os cards de módulos
            renderModuleCards(funcoes);

            // Adiciona evento ao botão de logout
            document.getElementById('logout-button').addEventListener('click', () => {
                const auth = getAuth();
                signOut(auth);
            });
        });
}

function renderModuleCards(funcoes) {
    const navLinks = document.getElementById('nav-links');
    navLinks.innerHTML = ''; // Limpa antes de adicionar

    // Mapeamento das áreas (mantenha a lógica que criamos antes)
    const areas = {
        financeiro: { titulo: 'Intranet Financeiro', url: './painel.html', roles: ['admin', 'financeiro'] },
        rh: { titulo: 'Intranet RH', url: '#', roles: ['admin', 'rh'] },
        // ... adicione todas as outras áreas aqui
    };

    // Lógica para decidir quais cards mostrar...
    // ...
    // E então criar os elementos e adicionar ao `navLinks`
}