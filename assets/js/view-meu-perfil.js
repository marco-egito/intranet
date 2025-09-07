(function() {
    if (!window.firebase || !firebase.apps.length) { return; }
    const auth = firebase.auth();
    const db = firebase.firestore();
    const gridContainer = document.getElementById('supervisor-grid-container');
    const modal = document.getElementById('edit-profile-modal');
    let fetchedSupervisors = []; 
    let isAdmin = false; 

    function createSupervisorCard(supervisor, podeEditar) {
        // ... (Esta função continua exatamente a mesma da nossa última versão)
        const card = document.createElement('div');
        card.className = 'supervisor-card';
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
                <div class="profile-section"><h4>Formação</h4><ul>${toList(supervisor.formacao)}</ul></div>
                <div class="profile-section"><h4>Especialização</h4><ul>${toList(supervisor.especializacao)}</ul></div>
                <div class="profile-section"><h4>Áreas de Atuação</h4><ul>${toList(supervisor.atuacao)}</ul></div>
                <div class="profile-section"><h4>Informações de Supervisão</h4><ul>${toList(supervisor.supervisaoInfo)}</ul></div>
                <div class="profile-section"><h4>Dias e Horários</h4><ul>${toList(supervisor.diasHorarios)}</ul></div>
            </div>`;
        return card;
    }
    
    if(modal) {
        // --- ALTERAÇÃO PRINCIPAL NO SCRIPT ---
        // O event listener agora é mais inteligente
        gridContainer.addEventListener('click', (e) => {
            const editButton = e.target.closest('.edit-supervisor-btn');
            // Se o clique foi no botão editar (ou dentro dele)
            if (editButton) {
                e.stopPropagation(); // Impede que o clique "vaze" para o card
                const uid = editButton.dataset.uid;
                openEditModal(uid);
                return; // Encerra a função aqui
            }

            // Se o clique foi em qualquer outra parte do card
            const card = e.target.closest('.supervisor-card');
            if (card) {
                // Alterna a classe que expande ou recolhe o card
                card.classList.toggle('is-expanded');
            }
        });

        const form = document.getElementById('edit-profile-form');
        function openEditModal(supervisorUid) {
            const supervisorData = fetchedSupervisors.find(s => s.uid === supervisorUid);
            if (!supervisorData) return;
            form.elements['editing-uid'].value = supervisorData.uid;
            form.elements['edit-titulo'].value = supervisorData.titulo || '';
            document.getElementById('edit-fotoUrl').value = supervisorData.fotoUrl || '';
            const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : './';
            document.getElementById('profile-photo-preview').src = supervisorData.fotoUrl ? pathPrefix + supervisorData.fotoUrl : pathPrefix + 'assets/img/default-user.png';
            form.elements['edit-abordagem'].value = supervisorData.abordagem || '';
            form.elements['edit-crp'].value = supervisorData.crp || '';
            form.elements['edit-email'].value = supervisorData.email || '';
            form.elements['edit-telefone'].value = supervisorData.telefone || '';
            form.elements['edit-formacao'].value = supervisorData.formacao || '';
            form.elements['edit-especializacao'].value = Array.isArray(supervisorData.especializacao) ? supervisorData.especializacao.join('\n') : supervisorData.especializacao || '';
            form.elements['edit-atuacao'].value = Array.isArray(supervisorData.atuacao) ? supervisorData.atuacao.join('\n') : supervisorData.atuacao || '';
            form.elements['edit-supervisaoInfo'].value = Array.isArray(supervisorData.supervisaoInfo) ? supervisorData.supervisaoInfo.join('\n') : supervisorData.supervisaoInfo || '';
            form.elements['edit-diasHorarios'].value = Array.isArray(supervisorData.diasHorarios) ? supervisorData.diasHorarios.join('\n') : supervisorData.diasHorarios || '';
            modal.style.display = 'flex';
        }
        function closeEditModal() { modal.style.display = 'none'; form.reset(); }
        async function saveProfileChanges(e) {
            e.preventDefault();
            const uid = form.elements['editing-uid'].value;
            if (!uid) return;
            const dataToUpdate = {
                titulo: form.elements['edit-titulo'].value.trim(),
                fotoUrl: document.getElementById('edit-fotoUrl').value.trim(),
                abordagem: form.elements['edit-abordagem'].value.trim(),
                crp: form.elements['edit-crp'].value.trim(),
                email: form.elements['edit-email'].value.trim(),
                telefone: form.elements['edit-telefone'].value.trim(),
                formacao: form.elements['edit-formacao'].value,
                especializacao: form.elements['edit-especializacao'].value.split('\n').filter(Boolean),
                atuacao: form.elements['edit-atuacao'].value.split('\n').filter(Boolean),
                supervisaoInfo: form.elements['edit-supervisaoInfo'].value.split('\n').filter(Boolean),
                diasHorarios: form.elements['edit-diasHorarios'].value.split('\n').filter(Boolean),
            };
            try {
                await db.collection('usuarios').doc(uid).update(dataToUpdate);
                closeEditModal();
                loadProfiles(auth.currentUser);
            } catch (error) { console.error("Erro ao salvar:", error); alert("Erro ao salvar."); }
        }
        modal.querySelector('.close-modal-btn').addEventListener('click', closeEditModal);
        document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
        document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
    }

    async function loadProfiles(user) {
        if (!gridContainer) return;
        try {
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            if (!userDoc.exists) throw new Error("Usuário não encontrado.");
            const userData = userDoc.data();
            isAdmin = (userData.funcoes || []).includes('admin');
            const podeEditar = isAdmin || (userData.funcoes || []).includes('supervisor');
            const query = db.collection('usuarios').where('funcoes', 'array-contains', 'supervisor').where('inativo', '==', false).orderBy('nome');
            const snapshot = await query.get();
            fetchedSupervisors = []; 
            if (snapshot.empty) { gridContainer.innerHTML = '<p>Nenhum supervisor encontrado.</p>'; return; }
            snapshot.forEach(doc => fetchedSupervisors.push({ uid: doc.id, ...doc.data() }));
            gridContainer.innerHTML = ''; 
            fetchedSupervisors.forEach(supervisor => {
                const cardElement = createSupervisorCard(supervisor, podeEditar);
                gridContainer.appendChild(cardElement);
            });
        } catch (error) { console.error("Erro ao carregar perfis:", error); gridContainer.innerHTML = '<p style="color:red;">Erro ao carregar perfis.</p>'; }
    }

    auth.onAuthStateChanged(user => {
        if (user) { loadProfiles(user); } 
        else { if(gridContainer) { gridContainer.innerHTML = '<p style="color:red;">Autenticação necessária.</p>'; } }
    });
})();