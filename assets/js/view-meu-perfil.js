// ATUALIZE ESTA FUNÇÃO no arquivo assets/js/view-meu-perfil.js
function createSupervisorCard(supervisor, podeEditar) {
    const card = document.createElement('div');
    card.className = 'supervisor-card';

    const toList = (data) => {
        if (!data) return '<li>Não informado</li>';
        const items = Array.isArray(data) ? data : [data];
        return items.map(item => `<li>${item}</li>`).join('');
    };
    
    const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : './';
    const photoPath = supervisor.fotoUrl ? pathPrefix + supervisor.fotoUrl : pathPrefix + 'assets/img/default-user.png';

    // Opcional: Adiciona um botão de editar com um ícone, se o usuário puder editar
    const editButtonHtml = podeEditar ? 
        `<button class="edit-supervisor-btn" data-uid="${supervisor.uid}">
            Editar
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        </button>` : '';

    card.innerHTML = `
        <div class="supervisor-card-left">
            <div class="photo-container">
                <img src="${photoPath}" alt="Foto de ${supervisor.nome || 'Supervisor'}" class="supervisor-photo" onerror="this.onerror=null;this.src='${pathPrefix}assets/img/default-user.png';">
            </div>
            <div class="supervisor-identity">
                <h2>${supervisor.nome || 'Nome Indisponível'}</h2>
                <div class="title-box">SUPERVISORA</div>
            </div>
            <div class="supervisor-contact">
                <p><strong>Telefone:</strong> ${supervisor.telefone || 'Não informado'}</p>
                <p><strong>Email:</strong> ${supervisor.email || 'Não informado'}</p>
                <p>www.eupsico.org.br</p>
            </div>
            <div class="logo-container">
                <img src="${pathPrefix}assets/img/logo-branca.png" alt="Logo EuPsico">
            </div>
        </div>

        <div class="supervisor-card-right">
            ${editButtonHtml}
            <div class="profile-header">
                <h3>PERFIL PROFISSIONAL</h3>
            </div>
            
            <div class="profile-section">
                <h4>Formação</h4>
                <ul>${toList(supervisor.formacao)}</ul>
            </div>
            
            <div class="profile-section">
                <h4>Especialização</h4>
                <ul>${toList(supervisor.especializacao)}</ul>
            </div>
            
            <div class="profile-section">
                <h4>Áreas de Atuação</h4>
                <ul>${toList(supervisor.atuacao)}</ul>
            </div>

            <div class="profile-section">
                <h4>Informações de Supervisão</h4>
                <ul>${toList(supervisor.supervisaoInfo)}</ul>
            </div>

            <div class="profile-section">
                <h4>Dias e Horários</h4>
                <ul>${toList(supervisor.diasHorarios)}</ul>
            </div>
        </div>
    `;
    return card;
}
