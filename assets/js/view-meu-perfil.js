(function() {
    if (!window.firebase || !firebase.apps.length) { return; }
    const auth = firebase.auth();
    const db = firebase.firestore();
    const gridContainer = document.getElementById('supervisor-grid-container');
    const editModal = document.getElementById('edit-profile-modal');
    const detailsModal = document.getElementById('details-profile-modal');
    let fetchedSupervisors = [];
    let isAdmin = false;

    function openDetailsModal(supervisorUid) {
        if (!detailsModal) return;
        const supervisorData = fetchedSupervisors.find(s => s.uid === supervisorUid);
        if (!supervisorData) return;
        
        const detailsBody = document.getElementById('details-modal-body');
        const toList = (data) => {
            if (!data || data.length === 0) return '<ul><li>Não informado</li></ul>';
            const items = Array.isArray(data) ? data : [data];
            return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
        };
        detailsBody.innerHTML = `
            <div class="profile-section"><h4>Formação</h4>${toList(supervisorData.formacao)}</div>
            <div class="profile-section"><h4>Especialização</h4>${toList(supervisorData.especializacao)}</div>
            <div class="profile-section"><h4>Áreas de Atuação</h4>${toList(supervisorData.atuacao)}</div>
            <div class="profile-section"><h4>Informações de Supervisão</h4>${toList(supervisorData.supervisaoInfo)}</div>
            <div class="profile-section"><h4>Dias e Horários</h4>${toList(supervisorData.diasHorarios)}</div>`;
        detailsModal.style.display = 'flex';
    }

    if (detailsModal) {
        detailsModal.querySelector('.close-modal-btn').addEventListener('click', () => {
            detailsModal.style.display = 'none';
        });
    }

    gridContainer.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-supervisor-btn');
        const card = e.target.closest('.supervisor-card');

        if (editButton) {
            e.stopPropagation();
            const uid = editButton.dataset.uid;
            openEditModal(uid);
        } else if (card && window.PROFILE_VIEW_MODE === 'all') {
             const uid = card.dataset.uid;
             openDetailsModal(uid);
        }
    });

    function createSupervisorCard(supervisor, podeEditar) {
        const card = document.createElement('div');
        card.className = 'supervisor-card';
        card.dataset.uid = supervisor.uid;

        const toList = (data) => {
            if (!data) return '<li>Não informado</li>';
            const items = Array.isArray(data) ? data : [data];
            return items.map(item => `<li>${item}</li>`).join('');
        };
        const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : './';
        const photoPath = supervisor.fotoUrl ? pathPrefix + supervisor.fotoUrl : pathPrefix + 'assets/img/default-user.png';
        const editButtonHtml = podeEditar ? `<button class="edit-supervisor-btn" data-uid="${supervisor.uid}">Editar <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>` : '';
        const crpHtml = supervisor.crp ? `<p><strong>CRP:</strong> ${supervisor.crp}</p>` : '';
        const titleText = supervisor.titulo ? supervisor.titulo.toUpperCase() : 'SUPERVISOR(A)';
        card.innerHTML = `
            <div class="supervisor-card-left">
                <div class="photo-container"><img src="${photoPath}" alt="Foto de ${supervisor.nome}" class="supervisor-photo" onerror="this.onerror=null;this.src='${pathPrefix}assets/img/default-user.png';"></div>
                <div class="supervisor-identity"><h2>${supervisor.nome || 'Nome Indisponível'}</h2><div class="title-box">${titleText}</div></div>
                <div class="supervisor-contact">${crpHtml}<p><strong>Telefone:</strong> ${supervisor.telefone || 'N/A'}</p><p><strong>Email:</strong> ${supervisor.email || 'N/A'}</p><p>www.eupsico.org.br</p></div>
                <div class="logo-container"><img src="${pathPrefix}assets/img/logo-branca.png" alt="Logo EuPsico"></div>
            </div>
            <div class="supervisor-card-right">
                ${editButtonHtml}
                <div class="profile-header"><h3>PERFIL PROFISSIONAL</h3></div>
                <div id="card-details-content">
                    <div class="profile-section"><h4>Formação</h4><ul>${toList(supervisor.formacao)}</ul></div>
                    <div class="profile-section"><h4>Especialização</h4><ul>${toList(supervisor.especializacao)}</ul></div>
                    <div class="profile-section"><h4>Áreas de Atuação</h4><ul>${toList(supervisor.atuacao)}</ul></div>
                    <div class="profile-section"><h4>Informações de Supervisão</h4><ul>${toList(supervisor.supervisaoInfo)}</ul></div>
                    <div class="profile-section"><h4>Dias e Horários</h4><ul>${toList(supervisor.diasHorarios)}</ul></div>
                </div>
            </div>`;
        return card;
    }
    
    if(editModal) {
        const form = document.getElementById('edit-profile-form');
        function openEditModal(supervisorUid) {
            const supervisorData = fetchedSupervisors.find(s => s.uid === supervisorUid); if (!supervisorData) return;
            form.elements['editing-uid'].value = supervisorData.uid; form.elements['edit-titulo'].value = supervisorData.titulo || '';
            document.getElementById('edit-fotoUrl').value = supervisorData.fotoUrl || '';
            const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : './';
            document.getElementById('profile-photo-preview').src = supervisorData.fotoUrl ? pathPrefix + supervisorData.fotoUrl : pathPrefix + 'assets/img/default-user.png';
            form.elements['edit-abordagem'].value = supervisorData.abordagem || ''; form.elements['edit-crp'].value = supervisorData.crp || '';
            form.elements['edit-email'].value = supervisorData.email || ''; form.elements['edit-telefone'].value = supervisorData.telefone || '';
            form.elements['edit-formacao'].value = supervisorData.formacao || '';
            form.elements['edit-especializacao'].value = Array.isArray(supervisorData.especializacao) ? supervisorData.especializacao.join('\n') : '';
            form.elements['edit-atuacao'].value = Array.isArray(supervisorData.atuacao) ? supervisorData.atuacao.join('\n') : '';
            form.elements['edit-supervisaoInfo'].value = Array.isArray(supervisorData.supervisaoInfo) ? supervisorData.supervisaoInfo.join('\n') : '';
            form.elements['edit-diasHorarios'].value = Array.isArray(supervisorData.diasHorarios) ? supervisorData.diasHorarios.join('\n') : '';
            editModal.style.display = 'flex';
        }
        function closeEditModal() { editModal.style.display = 'none'; form.reset(); }
        async function saveProfileChanges(e) {
            e.preventDefault(); const uid = form.elements['editing-uid'].value; if (!uid) return;
            const dataToUpdate = { /* ... data ... */ }; // (O objeto de dados completo)
            try {
                await db.collection('usuarios').doc(uid).update(dataToUpdate);
                closeEditModal(); loadProfiles(auth.currentUser);
            } catch (error) { console.error("Erro ao salvar:", error); }
        }
        editModal.querySelector('.close-modal-btn').addEventListener('click', closeEditModal);
        document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
        document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
    }

    async function loadProfiles(user) {
        if (!gridContainer) return;
        try {
            const userDoc = await db.collection('usuarios').doc(user.uid).get(); if (!userDoc.exists) throw new Error("Usuário não encontrado.");
            const userData = userDoc.data(); isAdmin = (userData.funcoes || []).includes('admin');
            const podeEditar = isAdmin || (userData.funcoes || []).includes('supervisor');
            let query;
            if (window.PROFILE_VIEW_MODE === 'all' || isAdmin) {
                query = db.collection('usuarios').where('funcoes', 'array-contains', 'supervisor').where('inativo', '==', false).orderBy('nome');
            } else {
                query = db.collection('usuarios').where(firebase.firestore.FieldPath.documentId(), '==', user.uid);
            }
            const snapshot = await query.get(); fetchedSupervisors = [];
            if (snapshot.empty) { gridContainer.innerHTML = '<p>Nenhum supervisor encontrado.</p>'; return; }
            snapshot.forEach(doc => fetchedSupervisors.push({ uid: doc.id, ...doc.data() }));
            gridContainer.innerHTML = '';
            fetchedSupervisors.forEach(supervisor => {
                const cardElement = createSupervisorCard(supervisor, podeEditar);
                gridContainer.appendChild(cardElement);
            });
        } catch (error) { console.error("Erro:", error); }
    }

    auth.onAuthStateChanged(user => {
        if (user) { loadProfiles(user); } 
        else { if(gridContainer) { gridContainer.innerHTML = '<p style="color:red;">Autenticação necessária.</p>'; } }
    });
})();