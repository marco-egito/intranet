// assets/js/view-me-perfil.js (Versão com CRP e Título Editável)
(function() {
    if (!window.firebase || !firebase.apps.length) {
        console.error("Firebase não inicializado neste ponto.");
        return;
    }
    const auth = firebase.auth();
    const db = firebase.firestore();

    const gridContainer = document.getElementById('supervisor-grid-container');
    const modal = document.getElementById('edit-profile-modal');
    
    let fetchedSupervisors = []; 
    let isAdmin = false; 

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

        const editButtonHtml = podeEditar ? 
            `<button class="edit-supervisor-btn" data-uid="${supervisor.uid}">
                Editar
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>` : '';

        // --- ALTERAÇÃO 1: LÓGICA PARA EXIBIR O CRP E O TÍTULO ---
        const crpHtml = supervisor.crp ? `<p><strong>CRP:</strong> ${supervisor.crp}</p>` : '';
        const titleText = supervisor.titulo ? supervisor.titulo.toUpperCase() : 'SUPERVISOR(A)';

        card.innerHTML = `
            <div class="supervisor-card-left">
                <div class="photo-container">
                    <img src="${photoPath}" alt="Foto de ${supervisor.nome || 'Supervisor'}" class="supervisor-photo" onerror="this.onerror=null;this.src='${pathPrefix}assets/img/default-user.png';">
                </div>
                <div class="supervisor-identity">
                    <h2>${supervisor.nome || 'Nome Indisponível'}</h2>
                    <div class="title-box">${titleText}</div>
                </div>
                <div class="supervisor-contact">
                    ${crpHtml}
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
                <div class="profile-section"><h4>Formação</h4><ul>${toList(supervisor.formacao)}</ul></div>
                <div class="profile-section"><h4>Especialização</h4><ul>${toList(supervisor.especializacao)}</ul></div>
                <div class="profile-section"><h4>Áreas de Atuação</h4><ul>${toList(supervisor.atuacao)}</ul></div>
                <div class="profile-section"><h4>Informações de Supervisão</h4><ul>${toList(supervisor.supervisaoInfo)}</ul></div>
                <div class="profile-section"><h4>Dias e Horários</h4><ul>${toList(supervisor.diasHorarios)}</ul></div>
            </div>
        `;
        return card;
    }
    
    if(modal) {
        const form = document.getElementById('edit-profile-form');
        const photoEditSection = document.querySelector('.photo-edit-section');

        function openEditModal(supervisorUid) {
            const supervisorData = fetchedSupervisors.find(s => s.uid === supervisorUid);
            if (!supervisorData) return;
            form.elements['editing-uid'].value = supervisorData.uid;
            
            // --- ALTERAÇÃO 2: CARREGAR O TÍTULO NO FORMULÁRIO ---
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
            if (photoEditSection) { photoEditSection.style.display = isAdmin ? 'block' : 'none'; }
            modal.style.display = 'flex';
        }

        function closeEditModal() { modal.style.display = 'none'; form.reset(); }

        async function saveProfileChanges(e) {
            e.preventDefault();
            const uid = form.elements['editing-uid'].value;
            if (!uid) return;
            
            const dataToUpdate = {
                // --- ALTERAÇÃO 3: SALVAR O NOVO CAMPO TÍTULO ---
                titulo: form.elements['edit-titulo'].value.trim(),

                fotoUrl: document.getElementById('edit-fotoUrl').value.trim(),
                abordagem: form.elements['edit-abordagem'].value.trim(),
                crp: form.elements['edit-crp'].value.trim(),
                email: form.elements['edit-email'].value.trim(),
                telefone: form.elements['edit-telefone'].value.trim(),
                formacao: form.elements['edit-formacao'].value,
                especializacao: form.elements['edit-especializacao'].value.split('\n').filter(line => line.trim() !== ''),
                atuacao: form.elements['edit-atuacao'].value.split('\n').filter(line => line.trim() !== ''),
                supervisaoInfo: form.elements['edit-supervisaoInfo'].value.split('\n').filter(line => line.trim() !== ''),
                diasHorarios: form.elements['edit-diasHorarios'].value.split('\n').filter(line => line.trim() !== ''),
            };

            try {
                await db.collection('usuarios').doc(uid).update(dataToUpdate);
                closeEditModal();
                loadProfiles(auth.currentUser);
            } catch (error) {
                console.error("Erro ao salvar alterações:", error);
                alert("Não foi possível salvar as alterações.");
            }
        }
        
        modal.querySelector('.close-modal-btn').addEventListener('click', closeEditModal);
        document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
        document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
        
        gridContainer.addEventListener('click', (e) => {
            if (e.target && e.target.closest('.edit-supervisor-btn')) {
                const button = e.target.closest('.edit-supervisor-btn');
                const uid = button.dataset.uid;
                openEditModal(uid);
            }
        });
    }

    async function loadProfiles(user) {
        if (!gridContainer) return;
        try {
            const forceAll = window.PROFILE_VIEW_MODE === 'all';
            window.PROFILE_VIEW_MODE = null;
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            if (!userDoc.exists) throw new Error("Usuário logado não encontrado.");
            const userData = userDoc.data();
            const funcoes = userData.funcoes || [];
            isAdmin = funcoes.includes('admin');
            const podeEditar = funcoes.includes('admin') || funcoes.includes('supervisor');
            let query;
            if (forceAll || isAdmin) {
                query = db.collection('usuarios').where('funcoes', 'array-contains', 'supervisor').where('inativo', '==', false).orderBy('nome');
            } else {
                query = db.collection('usuarios').where(firebase.firestore.FieldPath.documentId(), '==', user.uid);
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

    auth.onAuthStateChanged(user => {
        if (user) {
            loadProfiles(user);
        } else {
            if(gridContainer) {
                gridContainer.innerHTML = '<p style="color:red; text-align:center;">Autenticação necessária. Por favor, retorne e faça login.</p>';
            }
        }
    });

})();