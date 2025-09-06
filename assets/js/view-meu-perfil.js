// assets/js/view-meu-perfil.js (Versão 8 - Abordagem editável e condicional)
(function() {
    if (!window.firebase || !auth || !db) {
        console.error("Firebase não inicializado.");
        document.getElementById('supervisor-grid-container').innerHTML = '<p style="color:red;">Erro de inicialização.</p>';
        return;
    }

    const currentUser = auth.currentUser;
    const gridContainer = document.getElementById('supervisor-grid-container');
    let fetchedSupervisors = []; 
    let isAdmin = false; 

    const modal = document.getElementById('edit-profile-modal');
    if(modal) {
        const form = document.getElementById('edit-profile-form');
        const photoEditSection = document.querySelector('.photo-edit-section');

        function openEditModal(supervisorUid) {
            const supervisorData = fetchedSupervisors.find(s => s.uid === supervisorUid);
            if (!supervisorData) return;

            form.elements['editing-uid'].value = supervisorData.uid;

            document.getElementById('edit-fotoUrl').value = supervisorData.fotoUrl || '';

            const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : './';
            document.getElementById('profile-photo-preview').src = supervisorData.fotoUrl ? pathPrefix + supervisorData.fotoUrl : pathPrefix + 'assets/img/default-user.png';

            form.elements['edit-formacao'].value = supervisorData.formacao || '';
            // ALTERAÇÃO 1: Preenche o novo campo "Abordagem" no modal
            form.elements['edit-abordagem'].value = supervisorData.abordagem || '';

            form.elements['edit-especializacao'].value = Array.isArray(supervisorData.especializacao) ? supervisorData.especializacao.join('\n') : supervisorData.especializacao || '';
            form.elements['edit-atuacao'].value = Array.isArray(supervisorData.atuacao) ? supervisorData.atuacao.join('\n') : supervisorData.atuacao || '';
            form.elements['edit-supervisaoInfo'].value = Array.isArray(supervisorData.supervisaoInfo) ? supervisorData.supervisaoInfo.join('\n') : supervisorData.supervisaoInfo || '';
            form.elements['edit-diasHorarios'].value = Array.isArray(supervisorData.diasHorarios) ? supervisorData.diasHorarios.join('\n') : supervisorData.diasHorarios || '';
            
            if (photoEditSection) {
                photoEditSection.style.display = isAdmin ? 'block' : 'none';
            }
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

            const dataToUpdate = {
                fotoUrl: document.getElementById('edit-fotoUrl').value.trim(),
                formacao: form.elements['edit-formacao'].value.trim(),
                // ALTERAÇÃO 2: Adiciona o campo "Abordagem" ao objeto que será salvo
                abordagem: form.elements['edit-abordagem'].value.trim(),
                especializacao: form.elements['edit-especializacao'].value.split('\n').filter(line => line.trim() !== ''),
                atuacao: form.elements['edit-atuacao'].value.split('\n').filter(line => line.trim() !== ''),
                supervisaoInfo: form.elements['edit-supervisaoInfo'].value.split('\n').filter(line => line.trim() !== ''),
                diasHorarios: form.elements['edit-diasHorarios'].value.split('\n').filter(line => line.trim() !== ''),
            };

            try {
                await db.collection('usuarios').doc(uid).update(dataToUpdate);
                closeEditModal();
                loadProfiles();
            } catch (error) {
                console.error("Erro ao salvar alterações:", error);
                alert("Não foi possível salvar as alterações.");
            }
        }
        
        modal.querySelector('.close-modal-btn').addEventListener('click', closeEditModal);
        document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
        document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
        
        gridContainer.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('edit-supervisor-btn')) {
                const uid = e.target.dataset.uid;
                openEditModal(uid);
            }
        });
    }

    async function loadProfiles() {
        if (!currentUser || !gridContainer) return;
        
        try {
            const forceAll = window.PROFILE_VIEW_MODE === 'all';
            window.PROFILE_VIEW_MODE = null;

            const userDoc = await db.collection('usuarios').doc(currentUser.uid).get();
            if (!userDoc.exists) throw new Error("Usuário logado não encontrado.");
            
            const userData = userDoc.data();
            const funcoes = userData.funcoes || [];
            isAdmin = funcoes.includes('admin');
            const podeEditar = funcoes.includes('admin') || funcoes.includes('supervisor');

            let query;
            if (forceAll || isAdmin) {
                query = db.collection('usuarios').where('funcoes', 'array-contains', 'supervisor').where('inativo', '==', false).orderBy('nome');
            } else {
                query = db.collection('usuarios').where(firebase.firestore.FieldPath.documentId(), '==', currentUser.uid);
            }

            const snapshot = await query.get();
            fetchedSupervisors = []; 

            if (snapshot.empty) {
                gridContainer.innerHTML = '<p>Nenhum perfil de supervisor foi encontrado.</p>';
                return;
            }

            snapshot.forEach(doc => fetchedSupervisors.push({ uid: doc.id, ...doc.data() }));

            gridContainer.innerHTML = ''; 
            fetchedSupervisors.forEach(supervisor => {
                const cardElement = createSupervisorCard(supervisor, podeEditar);
                gridContainer.appendChild(cardElement);
            });

        } catch (error) {
            console.error("Erro ao carregar perfis:", error);
            gridContainer.innerHTML = '<p style="color:red;">Ocorreu um erro ao carregar os perfis.</p>';
        }
    }

    function createSupervisorCard(supervisor, podeEditar) {
        const article = document.createElement('article');
        article.className = 'supervisor-card-v2';

        const toList = (data) => {
            if (!data || data.length === 0) return '<li>Não informado</li>';
            return Array.isArray(data) ? data.map(item => `<li>${item}</li>`).join('') : `<li>${data}</li>`;
        };
        
        const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : './';
        const photoPath = supervisor.fotoUrl ? pathPrefix + supervisor.fotoUrl : pathPrefix + 'assets/img/default-user.png';
        const editButtonHTML = podeEditar ? `<button class="edit-supervisor-btn" data-uid="${supervisor.uid}">Editar</button>` : '';

        // ALTERAÇÃO 3: Cria o HTML da abordagem apenas se o campo não estiver em branco.
        const abordagemHTML = supervisor.abordagem ? `<h3>${supervisor.abordagem}</h3>` : '';

        article.innerHTML = `
            <div class="supervisor-v2-sidebar">
                <div class="supervisor-v2-photo">
                    <img src="${photoPath}" alt="Foto de ${supervisor.nome || ''}" onerror="this.onerror=null;this.src='../assets/img/default-user.png';">
                </div>
                <h2>${supervisor.nome || 'Nome não informado'}</h2>
                ${abordagemHTML}
                <ul class="supervisor-v2-contact">
                    <li><strong>CRP:</strong> ${supervisor.crp || 'N/A'}</li>
                    <li><strong>Telefone:</strong> ${supervisor.telefone || 'N/A'}</li>
                    <li><strong>Email:</strong> ${supervisor.email || 'N/A'}</li>
                </ul>
            </div>
            <div class="supervisor-v2-main">
                ${editButtonHTML}
                <div class="detail-group">
                    <h4>Formação</h4>
                    <ul><li>${supervisor.formacao || 'Não informado'}</li></ul>
                </div>
                <div class="detail-group">
                    <h4>Especialização</h4>
                    <ul>${toList(supervisor.especializacao)}</ul>
                </div>
                <div class="detail-group">
                    <h4>Áreas de Atuação</h4>
                    <ul>${toList(supervisor.atuacao)}</ul>
                </div>
                <div class="detail-group">
                    <h4>Informações de Supervisão</h4>
                    <ul>${toList(supervisor.supervisaoInfo)}</ul>
                </div>
                <div class="detail-group">
                    <h4>Dias e Horários</h4>
                    <ul>${toList(supervisor.diasHorarios)}</ul>
                </div>
            </div>
        `;
        return article;
    }

    loadProfiles();
})();
