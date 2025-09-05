(function() {
    if (!db || !auth.currentUser) {
        console.error("Firebase não inicializado ou usuário não logado.");
        return;
    }

    const currentUser = auth.currentUser;
    const perfilContainer = document.getElementById('perfil-container');

    /**
     * Cria o HTML completo para o card de um supervisor.
     * @param {object} prof - O objeto de dados do profissional vindo do Firestore.
     * @returns {string} O HTML do card.
     */
    function criarCardSupervisor(prof) {
        // Gera o HTML para cada seção de lista, apenas se os dados existirem
        const especializacaoHTML = (prof.especializacao || []).map(item => `<li>${item}</li>`).join('');
        const atuacaoHTML = (prof.atuacao || []).map(item => `<li>${item}</li>`).join('');
        const supervisaoHTML = (prof.supervisaoInfo || []).map(item => `<li>${item}</li>`).join('');
        const horariosHTML = (prof.diasHorarios || []).map(item => `<li>${item}</li>`).join('');

        return `
            <div class="supervisor-card">
                <div class="supervisor-card-left">
                    <h2>${prof.nome || 'Nome não informado'}</h2>
                    <h3>SUPERVISOR(A)</h3>
                    <ul class="contact-info">
                        <li>📧 ${prof.email || ''}</li>
                        <li>📞 ${prof.contato || ''}</li>
                        <li>🌐 www.eupsico.org.br</li>
                    </ul>
                    <div class="photo-container">
                        <img src="${prof.fotoUrl || '../assets/img/default-user.png'}" alt="Foto de ${prof.nome}" class="supervisor-photo">
                        <img src="../assets/img/logo-branca.png" alt="Logo EuPsico" class="overlay-logo">
                    </div>
                </div>
                <div class="supervisor-card-right">
                    <div class="profile-header">PERFIL</div>
                    
                    ${prof.formacao ? `<h4>Formação</h4><ul><li>${prof.formacao}</li></ul>` : ''}
                    ${especializacaoHTML ? `<h4>Especialização</h4><ul>${especializacaoHTML}</ul>` : ''}
                    ${atuacaoHTML ? `<h4>Atuação</h4><ul>${atuacaoHTML}</ul>` : ''}
                    ${supervisaoHTML ? `<h4>Supervisão</h4><ul>${supervisaoHTML}</ul>` : ''}
                    ${horariosHTML ? `<h4>Dias e Horários</h4><ul>${horariosHTML}</ul>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Função principal que busca os dados do supervisor logado e renderiza o perfil.
     */
    async function carregarMeuPerfil() {
        if (!perfilContainer) return;
        try {
            const doc = await db.collection('usuarios').doc(currentUser.uid).get();
            if (doc.exists) {
                perfilContainer.innerHTML = criarCardSupervisor(doc.data());
            } else {
                perfilContainer.innerHTML = '<p>Seu perfil não foi encontrado no banco de dados.</p>';
            }
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            perfilContainer.innerHTML = '<p style="color:red;">Ocorreu um erro ao carregar seu perfil.</p>';
        }
    }

    // Adiciona o evento de clique ao botão "Editar Meu Perfil"
    const editButton = document.getElementById('edit-profile-main-btn');
    if (editButton) {
        editButton.addEventListener('click', () => {
            // A função openEditModal está no script principal do painel (supervisores.js)
            // e foi anexada ao objeto 'window' para ser acessível aqui.
            if (window.openEditModal) {
                window.openEditModal(currentUser.uid);
            } else {
                console.error("A função openEditModal não foi encontrada.");
            }
        });
    }

    // Inicia o carregamento do perfil
    carregarMeuPerfil();
})();
