// assets/js/supervisores.js (Versão 5 - Edição Admin e Supervisor)
const firebaseConfig = {
  apiKey: "AIzaSyDJqPJjDDIGo7uRewh3pw1SQZOpMgQJs5M",
  authDomain: "eupsico-agendamentos-d2048.firebaseapp.com",
  databaseURL: "https://eupsico-agendamentos-d2048-default-rtdb.firebaseio.com",
  projectId: "eupsico-agendamentos-d2048",
  storageBucket: "eupsico-agendamentos-d2048.firebasestorage.app",
  messagingSenderId: "1041518416343",
  appId: "1:1041518416343:web:0a11c03c205b802ed7bb92"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage(); // Inicia o Storage

(function() {
    const container = document.getElementById('supervisor-grid-container');
    let currentUser = null;
    let currentUserData = {};

    const modal = document.getElementById('edit-profile-modal');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const editingUidField = document.getElementById('editing-uid');

    // ALTERAÇÃO: A função agora aceita um UID para saber quem editar
    async function openEditModal(uid) {
        if (!uid || !modal) return;
        editingUidField.value = uid; // Guarda o UID de quem está sendo editado

        try {
            const userDoc = await db.collection('usuarios').doc(uid).get();
            if (!userDoc.exists) {
                alert("Documento do usuário não foi encontrado.");
                return;
            }
            const data = userDoc.data();

            document.getElementById('profile-photo-preview').src = data.fotoUrl || '../assets/img/default-user.png';
            document.getElementById('edit-formacao').value = data.formacao || '';
            document.getElementById('edit-especializacao').value = (data.especializacao || []).join('\n');
            document.getElementById('edit-atuacao').value = (data.atuacao || []).join('\n');
            document.getElementById('edit-supervisaoInfo').value = (data.supervisaoInfo || []).join('\n');
            document.getElementById('edit-diasHorarios').value = (data.diasHorarios || []).join('\n');
            
            modal.style.display = 'flex';
        } catch (error) {
            console.error("Erro ao carregar dados do perfil:", error);
            alert("Não foi possível carregar os dados para edição.");
        }
    }

    function closeEditModal() { if(modal) modal.style.display = 'none'; }

    async function carregarSupervisores() {
        if (!container) return;
        const userIsAdmin = currentUserData.funcoes?.includes('admin') || false;

        try {
            const query = db.collection('usuarios').where('funcoes', 'array-contains', 'supervisor').where('inativo', '==', false).orderBy('nome');
            const snapshot = await query.get();
            container.innerHTML = '';
            if (snapshot.empty) {
                container.innerHTML = '<p>Nenhum supervisor encontrado.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const prof = doc.data();
                // Passa a informação se o usuário é admin para a função que cria o card
                const cardHTML = criarCardSupervisor(prof, userIsAdmin);
                container.innerHTML += cardHTML;
            });
        } catch (error) {
            console.error("Erro ao carregar supervisores:", error);
            container.innerHTML = '<p style="color:red;">Erro ao carregar a lista de supervisores.</p>';
        }
    }
    
    // ALTERAÇÃO: A função agora adiciona o botão de editar se o usuário for admin
    function criarCardSupervisor(prof, isAdmin) {
        const especializacaoHTML = (prof.especializacao || []).map(item => `<li>${item}</li>`).join('');
        const atuacaoHTML = (prof.atuacao || []).map(item => `<li>${item}</li>`).join('');
        const supervisaoHTML = (prof.supervisaoInfo || []).map(item => `<li>${item}</li>`).join('');
        const horariosHTML = (prof.diasHorarios || []).map(item => `<li>${item}</li>`).join('');

        // Adiciona o botão de editar apenas se for admin
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

    auth.onAuthStateChanged(async user => {
        if (user) {
            currentUser = user;
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            if (userDoc.exists) {
                currentUserData = userDoc.data();
                const userIsSupervisor = currentUserData.funcoes?.includes('supervisor');

                if (userIsSupervisor && !document.getElementById('edit-profile-main-btn')) {
                    const editButton = document.createElement('button');
                    editButton.id = 'edit-profile-main-btn';
                    editButton.className = 'action-button';
                    editButton.textContent = 'Editar Meu Perfil';
                    editButton.style.marginBottom = '20px';
                    // O botão principal sempre edita o perfil do usuário logado
                    editButton.addEventListener('click', () => openEditModal(currentUser.uid)); 
                    if (container && container.parentNode) {
                       container.parentNode.insertBefore(editButton, container);
                    }
                }
            }
            carregarSupervisores();
        } else {
            currentUser = null;
            currentUserData = {};
            carregarSupervisores();
        }
    });

    // Event listener para o botão "Salvar" do modal
    saveProfileBtn.addEventListener('click', async () => {
        const uidToEdit = editingUidField.value;
        if (!uidToEdit) return;

        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = 'Salvando...';

        try {
            const toArray = (textareaId) => {
                const text = document.getElementById(textareaId).value;
                return text.split('\n').map(line => line.trim()).filter(line => line);
            };
            const dataToUpdate = {
                formacao: document.getElementById('edit-formacao').value.trim(),
                especializacao: toArray('edit-especializacao'),
                atuacao: toArray('edit-atuacao'),
                supervisaoInfo: toArray('edit-supervisaoInfo'),
                diasHorarios: toArray('edit-diasHorarios')
            };
            await db.collection('usuarios').doc(uidToEdit).update(dataToUpdate);
            alert("Perfil atualizado com sucesso!");
            closeEditModal();
            carregarSupervisores();
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            alert("Ocorreu um erro ao salvar o perfil.");
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Salvar Alterações';
        }
    });
    
    // NOVO: Listener geral para os botões de editar dos admins
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-supervisor-btn')) {
            const supervisorUid = e.target.dataset.uid;
            openEditModal(supervisorUid);
        }
    });

    if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);
    if (closeModalBtns) closeModalBtns.forEach(btn => btn.addEventListener('click', closeEditModal));
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeEditModal(); });
})();
