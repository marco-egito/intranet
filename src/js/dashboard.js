// /src/js/dashboard.js
import { getAuth, signOut } from "firebase/auth";

export function loadDashboard(appContainer, user, funcoes) {
    // Carrega a estrutura HTML do dashboard a partir de um arquivo separado
    fetch('/src/pages/dashboard.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar o HTML do dashboard! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // Insere o HTML dentro do container principal da aplicação
            appContainer.innerHTML = `<div class="app-container-inner">${html}</div>`;

            // Preenche os dados do usuário no cabeçalho
            document.getElementById('user-photo').src = user.photoURL || 'https://i.ibb.co/61Ym24n/default-user.png';
            document.getElementById('user-email').textContent = user.email;
            
            // Chama a função para criar e mostrar os cards dos módulos
            renderModuleCards(funcoes);

            // Adiciona a funcionalidade ao botão de logout
            document.getElementById('logout-button').addEventListener('click', () => {
                const auth = getAuth();
                signOut(auth);
            });
        })
        .catch(error => {
            console.error("Detalhes do erro:", error);
            appContainer.innerHTML = `<p style="color: red; text-align:center;">Não foi possível carregar o painel. Verifique o console para mais detalhes.</p>`;
        });
}

function renderModuleCards(funcoes) {
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) {
        console.error("Elemento #nav-links não foi encontrado no HTML do dashboard.");
        return;
    }
    navLinks.innerHTML = ''; // Limpa a área antes de adicionar os novos cards

    // Objeto com todos os ícones SVG para fácil acesso
    const icons = {
        intranet: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 12c0-5.25-4.25-9.5-9.5-9.5S2.5 6.75 2.5 12s4.25 9.5 9.5 9.5s9.5-4.25 9.5-9.5Z"/><path d="M12 2.5v19"/><path d="M2.5 12h19"/></svg>`,
        administrativo: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
        captacao: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
        financeiro: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        gestao: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
        grupos: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        marketing: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
        plantao: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
        rh: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
        servico_social: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
        supervisao: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    };

    // Mapeamento de todas as áreas, suas permissões e metadados
    const areas = {
        intranet: { titulo: 'Intranet Geral', descricao: 'Avisos, notícias e informações para todos.', url: 'URL_DA_INTRANET_GERAL_AQUI', roles: ['todos'], icon: icons.intranet },
        administrativo: { titulo: 'Intranet Administrativo', descricao: 'Processos, documentos e organização.', url: '#', roles: ['admin', 'administrativo'], icon: icons.administrativo },
        captacao: { titulo: 'Intranet Captação', descricao: 'Ferramentas e informações para captação.', url: '#', roles: ['admin', 'captacao'], icon: icons.captacao },
        financeiro: { titulo: 'Intranet Financeiro', descricao: 'Painel de controle financeiro e relatórios.', url: './painel.html', roles: ['admin', 'financeiro'], icon: icons.financeiro },
        gestao: { titulo: 'Intranet Gestão', descricao: 'Relatórios gerenciais e planejamento.', url: '#', roles: ['admin', 'gestao'], icon: icons.gestao },
        grupos: { titulo: 'Intranet Grupos', descricao: 'Informações e materiais para grupos.', url: '#', roles: ['admin', 'grupos'], icon: icons.grupos },
        marketing: { titulo: 'Intranet Marketing', descricao: 'Materiais de marketing e campanhas.', url: '#', roles: ['admin', 'marketing'], icon: icons.marketing },
        plantao: { titulo: 'Intranet Plantão', descricao: 'Escalas, contatos e procedimentos.', url: '#', roles: ['admin', 'plantao'], icon: icons.plantao },
        rh: { titulo: 'Intranet RH', descricao: 'Recursos humanos, vagas e comunicados.', url: '#', roles: ['admin', 'rh'], icon: icons.rh },
        servico_social: { titulo: 'Intranet Serviço Social', descricao: 'Documentos e orientações do S.S.', url: '#', roles: ['admin', 'servico_social'], icon: icons.servico_social },
        supervisao: { titulo: 'Intranet Supervisão', descricao: 'Acompanhamento de equipes e feedback.', url: '#', roles: ['admin', 'supervisao'], icon: icons.supervisao },
    };

    let cardsParaMostrar = [];

    // Filtra os cards que o usuário tem permissão para ver
    for (const key in areas) {
        const area = areas[key];
        // O usuário vê o link se for admin, se for para 'todos', ou se tiver a role específica
        const temPermissao = funcoes.includes('admin') || area.roles.includes('todos') || area.roles.some(role => funcoes.includes(role));
        if (temPermissao) {
            cardsParaMostrar.push(area);
        }
    }

    // Ordena os cards, mantendo a Intranet Geral no topo
    cardsParaMostrar.sort((a, b) => {
        if (a.titulo.includes('Intranet Geral')) return -1;
        if (b.titulo.includes('Intranet Geral')) return 1;
        return a.titulo.localeCompare(b.titulo);
    });
    
    // Cria e insere o HTML de cada card na página
    cardsParaMostrar.forEach(config => {
        const card = document.createElement('a');
        card.href = config.url;
        card.className = 'module-card';
        if (config.url !== '#') {
            card.target = '_blank';
        }

        card.innerHTML = `
            <div class="card-icon">${config.icon}</div>
            <div class="card-content">
                <h3>${config.titulo}</h3>
                <p>${config.descricao}</p>
            </div>
        `;
        navLinks.appendChild(card);
    });
}