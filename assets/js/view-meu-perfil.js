// assets/js/view-meu-perfil.js (Versão 2 - Completo com Edição)
(function() {
    if (!window.firebase || !auth || !db) {
        console.error("Firebase não inicializado.");
        document.getElementById('supervisor-grid-container').innerHTML = '<p style="color:red;">Erro de inicialização. Verifique o console.</p>';
        return;
    }

    const currentUser = auth.currentUser;
    const gridContainer = document.getElementById('supervisor-grid-container');
    let fetchedSupervisors = []; // Armazena os dados para usar no modal
    let isAdmin = false; // Armazena o status de admin do usuário logado

    // --- LÓGICA DO MODAL DE EDIÇÃO ---
    const modal = document.getElementById('edit-profile-modal');
    const form = document.getElementById('edit-profile-form');
    const photoEditSection = document.querySelector('.photo-edit-section');

    function openEditModal(supervisorUid) {
        const supervisorData = fetchedSupervisors.find(s => s.uid === supervisorUid);
        if (!supervisorData) return;

        // Preenche o formulário
        form.elements['editing-uid'].value = supervisorData.uid;
        form.elements['edit-formacao'].value = Array.isArray(supervisorData.formacao) ? supervisorData.formacao.join('\n') : supervisorData.formacao || '';
        form.elements['edit-especializacao'].value = Array.isArray(supervisorData.especializacao) ? supervisorData.especializacao.join('\n') : supervisorData.especializacao || '';
        form.elements['edit-atuacao'].value = Array.isArray(supervisorData.atuacao) ? supervisorData.atuacao.join('\n') : supervisorData.atuacao || '';
        form.elements['edit-supervisaoInfo'].value = Array.isArray(supervisorData.supervisaoInfo) ? supervisorData.supervisaoInfo.join('\n') : supervisorData.supervisaoInfo || '';
        form.elements['edit-diasHorarios'].value = Array.isArray(supervisorData.diasHorarios) ? supervisorData.diasHorarios.join('\n') : supervisorData.diasHorarios || '';
        
        // Mostra/oculta a edição de foto para admins
        photoEditSection.style.display = isAdmin ? 'block' : 'none';

        modal.style.display = 'flex';
    }

    function closeEditModal() {
        modal.style.display = 'none';
        form.reset();
    }

    async function saveProfileChanges(e) {
        e.preventDefault();
        const uid = form.elements['editing-uid'].value;
        if (!uid) return;

        const updateData = {
            formacao: form.elements['edit-formacao'].value.split('\n').filter(line => line.trim() !== ''),
            especializacao: form.elements['edit-especializacao'].value.split('\n').filter(line => line.trim() !== ''),
            atuacao: form.elements['edit-atuacao'].value.split('\n').filter(line => line.trim() !== ''),
            supervisaoInfo: form.elements['edit-supervisaoInfo'].value.split('\n').filter(line => line.trim() !== ''),
            diasHorarios: form.elements['edit-diasHorarios'].value.split('\n').filter(line => line.trim() !== ''),
        };

        try {
            await db.collection('usuarios').doc(uid).update(updateData);
            closeEditModal();
            loadProfiles(); // Recarrega os perfis para mostrar os dados atualizados
        } catch (error) {
            console.error("Erro ao salvar alterações:", error);
            alert("Não foi possível salvar as alterações.");
        }
    }
    
    // Adiciona os event listeners uma única vez
    if(modal) {
        modal.querySelector('.close-modal-btn').addEventListener('click', closeEditModal);
        document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
        document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
    }
    gridContainer.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('edit-supervisor-btn')) {
            const uid = e.target.dataset.uid;
            openEditModal(uid);
        }
    });
    // --- FIM DA LÓGICA DO MODAL ---


    async function loadProfiles() {
        if (!currentUser || !gridContainer) return;
        
        try {
            const userDoc = await db.collection('usuarios').doc(currentUser.uid).get();
            if (!userDoc.exists) throw new Error("Usuário logado não encontrado.");
            
            const userData = userDoc.data();
            isAdmin = userData.funcoes && userData.funcoes.includes('admin');

            let query;
            if (isAdmin) {
                query = db.collection('usuarios').where('funcoes', 'array-contains', 'supervisor').where('inativo', '==', false).orderBy('nome');
            } else {
                query = db.collection('usuarios').where(firebase.firestore.FieldPath.documentId(), '==', currentUser.uid);
            }

            const snapshot = await query.get();
            fetchedSupervisors = []; // Limpa o array antigo

            if (snapshot.empty) {
                gridContainer.innerHTML = '<p>Nenhum perfil de supervisor foi encontrado.</p>';
                return;
            }

            snapshot.forEach(doc => fetchedSupervisors.push({ uid: doc.id, ...doc.data() }));

            gridContainer.innerHTML = ''; 
            fetchedSupervisors.forEach(supervisor => {
                const cardElement = createSupervisorCard(supervisor);
                gridContainer.appendChild(cardElement);
            });

        } catch (error) {
            console.error("Erro ao carregar perfis:", error);
            gridContainer.innerHTML = '<p style="color:red;">Ocorreu um erro ao carregar os perfis.</p>';
        }
    }

    function createSupervisorCard(supervisor) {
        const card = document.createElement('div');
        card.className = 'supervisor-card';

        const toList = (data) => {
            if (!data) return '<li>Não informado</li>';
            return Array.isArray(data) ? data.map(item => `<li>${item}</li>`).join('') : `<li>${data}</li>`;
        };

        const photoName = supervisor.foto || `${supervisor.nome.toLowerCase().split(' ')[0]}.png`;
        const photoUrl = `../assets/img/supervisores/${photoName}`;

        card.innerHTML = `
            <div class="supervisor-card-left">
                <h2>${supervisor.nome || 'Nome Indisponível'}</h2>
                <h3>${supervisor.abordagem || 'Abordagem não informada'}</h3>
                <ul class="contact-info">
                    <li><strong>CRP:</strong> ${supervisor.crp || 'N/A'}</li>
                    <li><strong>Telefone:</strong> ${supervisor.telefone || 'N/A'}</li>
                    <li><strong>Email:</strong> ${supervisor.email || 'N/A'}</li>
                </ul>
                <div class="photo-container">
                    <img src="${photoUrl}" alt="Foto de ${supervisor.nome}" class="supervisor-photo" onerror="this.onerror=null;this.src='../assets/img/default-user.png';">
                    <img src="../assets/img/logo-eupsico.png" alt="Logo EuPsico" class="overlay-logo">
                </div>
            </div>
            <div class="supervisor-card-right">
                <button class="edit-supervisor-btn" data-uid="${supervisor.uid}">Editar</button>
                <div class="profile-header">PERFIL PROFISSIONAL</div>
                <h4>Formação</h4>
                <ul>${toList(supervisor.formacao)}</ul>
                <h4>Especialização</h4>
                <ul>${toList(supervisor.especializacao)}</ul>
                <h4>Áreas de Atuação</h4>
                <ul>${toList(supervisor.atuacao)}</ul>
                <h4>Informações de Supervisão</h4>
                <ul>${toList(supervisor.supervisaoInfo)}</ul>
                <h4>Dias e Horários</h4>
                <ul>${toList(supervisor.diasHorarios)}</ul>
            </div>
        `;
        return card;
    }

    loadProfiles();
})();
