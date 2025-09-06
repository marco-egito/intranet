// assets/js/view-meu-perfil.js (Corrigido para Admin)
(function() {
    if (!db || !auth.currentUser) return;

    const currentUser = auth.currentUser;
    const perfilContainer = document.getElementById('perfil-container');
    let currentUserData = {};

    function criarCardSupervisor(prof, isAdmin) {
        const especializacaoHTML = (prof.especializacao || []).map(item => `<li>${item}</li>`).join('');
        const atuacaoHTML = (prof.atuacao || []).map(item => `<li>${item}</li>`).join('');
        const supervisaoHTML = (prof.supervisaoInfo || []).map(item => `<li>${item}</li>`).join('');
        const horariosHTML = (prof.diasHorarios || []).map(item => `<li>${item}</li>`).join('');
        const adminEditButton = isAdmin ? `<button class="edit-supervisor-btn" data-uid="${prof.uid}">Editar</button>` : '';

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
                    ${adminEditButton}
                    <div class="profile-header">PERFIL</div>
                    ${prof.formacao ? `<h4>Formação</h4><ul><li>${prof.formacao}</li></ul>` : ''}
                    ${especializacaoHTML ? `<h4>Especialização</h4><ul>${especializacaoHTML}</ul>` : ''}
                    ${atuacaoHTML ? `<h4>Atuação</h4><ul>${atuacaoHTML}</ul>` : ''}
                    ${supervisaoHTML ? `<h4>Supervisão</h4><ul>${supervisaoHTML}</ul>` : ''}
                    ${horariosHTML ? `<h4>Dias e Horários</h4><ul>${horariosHTML}</ul>` : ''}
                </div>
            </div>`;
    }

    async function carregarPerfis() {
        if (!perfilContainer) return;
        
        const userIsAdmin = window.isAdmin === true;

        const query = userIsAdmin 
            ? db.collection('usuarios').where('funcoes', 'array-contains', 'supervisor').where('inativo', '==', false).orderBy('nome')
            : db.collection('usuarios').where('uid', '==', currentUser.uid);

        try {
            const snapshot = await query.get();
            perfilContainer.innerHTML = '';
            if (snapshot.empty) {
                perfilContainer.innerHTML = '<p>Nenhum perfil de supervisor encontrado.</p>';
                return;
            }
            snapshot.forEach(doc => {
                perfilContainer.innerHTML += criarCardSupervisor(doc.data(), userIsAdmin);
            });
        } catch (error) {
            console.error("Erro ao carregar perfil(s):", error);
            perfilContainer.innerHTML = '<p style="color:red;">Ocorreu um erro ao carregar os perfis.</p>';
        }
    }
    
    const editButton = document.getElementById('edit-profile-main-btn');
    if (editButton) {
        db.collection("usuarios").doc(currentUser.uid).get().then(doc => {
             if (doc.exists) {
                const isSupervisorOnly = doc.data().funcoes?.includes('supervisor') && !doc.data().funcoes?.includes('admin');
                editButton.style.display = isSupervisorOnly ? 'block' : 'none';
             }
        });
        editButton.addEventListener('click', () => {
            if (window.openEditModal) {
                window.openEditModal(currentUser.uid);
            }
        });
    }

    perfilContainer.addEventListener('click', (e) => {
        if(e.target.classList.contains('edit-supervisor-btn')) {
            const uid = e.target.dataset.uid;
            if(window.openEditModal) {
                window.openEditModal(uid);
            }
        }
    });

    carregarPerfis();
})();
