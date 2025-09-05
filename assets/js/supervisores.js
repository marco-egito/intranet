// assets/js/supervisores.js (Versão 6 - Painel do Supervisor Completo)
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
    const perfilContainer = document.getElementById('supervisor-card-aqui');
    const supervisionadosContainer = document.getElementById('meus-supervisionados-container');
    let currentUser = null;

    // Elementos do Modal
    const modal = document.getElementById('edit-profile-modal');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const editingUidField = document.getElementById('editing-uid');

    // Função que abre o modal e carrega os dados do supervisor logado
    async function openEditModal(uid) {
        if (!uid || !modal) return;
        editingUidField.value = uid;

        try {
            const userDoc = await db.collection('usuarios').doc(uid).get();
            if (!userDoc.exists) {
                alert("Seu documento de usuário não foi encontrado.");
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
            alert("Não foi possível carregar seus dados para edição.");
        }
    }

    function closeEditModal() {
        if (modal) modal.style.display = 'none';
    }
    
    // A função que cria o HTML do card de perfil
    function criarCardSupervisor(prof) {
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

    async function carregarPainelSupervisor() {
        if (!currentUser || !perfilContainer || !supervisionadosContainer) return;

        // 1. Carregar e exibir o card do próprio supervisor
        try {
            const doc = await db.collection('usuarios').doc(currentUser.uid).get();
            if (doc.exists) {
                perfilContainer.innerHTML = criarCardSupervisor(doc.data());
            } else {
                perfilContainer.innerHTML = '<p>Seu perfil não foi encontrado.</p>';
            }
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            perfilContainer.innerHTML = '<p style="color:red;">Erro ao carregar seu perfil.</p>';
        }

        // 2. Carregar e exibir a lista de acompanhamentos supervisionados
        try {
            const supervisaoQuery = db.collection('supervisao').where('supervisorUid', '==', currentUser.uid).orderBy('supervisaoData', 'desc');
            const snapshot = await supervisaoQuery.get();

            let listaHTML = '<div id="lista-registros"></div>';
            const listaContainer = document.createElement('div');
            
            if (snapshot.empty) {
                listaContainer.innerHTML = '<p>Nenhum acompanhamento encontrado para sua supervisão.</p>';
            } else {
                snapshot.forEach(doc => {
                    const registro = { id: doc.id, ...doc.data() };
                    // Reutiliza o estilo da lista de acompanhamentos
                    listaContainer.innerHTML += `
                        <div class="registro-item" data-id="${registro.id}">
                            <span><strong>Paciente:</strong> ${registro.pacienteIniciais || 'N/A'}</span>
                            <span><strong>Psicólogo(a):</strong> ${registro.psicologoNome || 'N/A'}</span>
                            <span><strong>Data:</strong> ${registro.supervisaoData ? new Date(registro.supervisaoData + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</span>
                        </div>`;
                });
            }
            // Adiciona a lista ao container principal, evitando duplicatas
            const oldLista = supervisionadosContainer.querySelector('#lista-registros');
            if(oldLista) oldLista.remove();
            supervisionadosContainer.appendChild(listaContainer);
            listaContainer.id = 'lista-registros';

        } catch (error) {
            console.error("Erro ao carregar supervisionados:", error);
            supervisionadosContainer.innerHTML += '<p style="color:red;">Erro ao carregar a lista de acompanhamentos.</p>';
        }
    }

    // --- LÓGICA DE AUTENTICAÇÃO E INICIALIZAÇÃO ---
    auth.onAuthStateChanged(async user => {
        if (user) {
            currentUser = user;
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().funcoes?.includes('supervisor')) {
                carregarPainelSupervisor();
            } else {
                document.querySelector('.admin-panel-container').innerHTML = '<h2>Acesso Negado</h2><p>Esta área é exclusiva para supervisores.</p><a href="../index.html" class="secondary-action-button">&larr; Voltar</a>';
            }
        } else {
            window.location.href = '../index.html';
        }
    });
    
    // --- EVENT LISTENERS PARA O PAINEL ---
    const editButton = document.getElementById('edit-profile-main-btn');
    if(editButton) editButton.addEventListener('click', () => openEditModal(currentUser.uid));

    supervisionadosContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.registro-item');
        if (item) {
            // Futuramente, esta ação abrirá o formulário para edição/visualização
            alert("Funcionalidade para abrir o formulário do supervisionado será implementada aqui.");
        }
    });

    if (saveProfileBtn) {
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
                carregarPainelSupervisor(); // Recarrega o painel para mostrar as alterações
            } catch (error) {
                console.error("Erro ao salvar perfil:", error);
                alert("Ocorreu um erro ao salvar o perfil.");
            } finally {
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = 'Salvar Alterações';
            }
        });
    }

    if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);
    if (closeModalBtns) closeModalBtns.forEach(btn => btn.addEventListener('click', closeEditModal));
    if (modal) {
        modal.addEventListener('click', e => { if (e.target === modal) closeEditModal(); });
    }

})();
