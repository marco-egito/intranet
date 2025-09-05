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
const storage = firebase.storage();

window.showSupervisorDashboard = function() {
    const dashboardContent = document.getElementById('supervisor-dashboard-content');
    const viewContentArea = document.getElementById('view-content-area');
    if(viewContentArea) {
        viewContentArea.style.display = 'none';
        viewContentArea.innerHTML = '';
    }
    if(dashboardContent) dashboardContent.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function() {
    if (!db || !auth) return;

    const dashboardContent = document.getElementById('supervisor-dashboard-content');
    const viewContentArea = document.getElementById('view-content-area');
    const perfilContainer = document.getElementById('supervisor-card-aqui');
    const supervisionadosContainer = document.getElementById('meus-supervisionados-container');
    let currentUser = null;

    const modal = document.getElementById('edit-profile-modal');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const editingUidField = document.getElementById('editing-uid');

    async function loadFormularioView(docId) {
        if (!dashboardContent || !viewContentArea) return;
        dashboardContent.style.display = 'none';
        viewContentArea.style.display = 'block';
        viewContentArea.innerHTML = '<h2>Carregando Formulário...</h2><div class="loading-spinner"></div>';
        window.formSupervisaoInitialDocId = docId;
        try {
            const htmlResponse = await fetch('./formulario-supervisao.html');
            if (!htmlResponse.ok) throw new Error('HTML não encontrado');
            viewContentArea.innerHTML = await htmlResponse.text();
            const existingScript = document.querySelector('script[data-view-script="formulario-supervisao"]');
            if (existingScript) existingScript.remove();
            if (!document.querySelector('link[href*="formulario-supervisao.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '../assets/css/formulario-supervisao.css';
                document.head.appendChild(link);
            }
            const script = document.createElement('script');
            script.src = '../assets/js/formulario-supervisao.js';
            script.dataset.viewScript = 'formulario-supervisao';
            document.body.appendChild(script);
        } catch (error) {
            console.error('Erro ao carregar a view do formulário:', error);
            viewContentArea.innerHTML = '<h2>Erro ao carregar o formulário.</h2>';
        }
    }

    async function openEditModal(uid) {
        if (!uid || !modal) return;
        editingUidField.value = uid;
        try {
            const userDoc = await db.collection('usuarios').doc(uid).get();
            if (!userDoc.exists) { alert("Documento do usuário não foi encontrado."); return; }
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

    function closeEditModal() { if (modal) modal.style.display = 'none'; }

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
            </div>`;
    }

    async function carregarPainelSupervisor() {
        if (!currentUser || !perfilContainer || !supervisionadosContainer) return;
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
        try {
            const supervisaoQuery = db.collection('supervisao').where('supervisorUid', '==', currentUser.uid).orderBy('supervisaoData', 'desc');
            const snapshot = await supervisaoQuery.get();
            let listaHTML = '';
            if (snapshot.empty) {
                listaHTML = '<p>Nenhum acompanhamento encontrado para sua supervisão.</p>';
            } else {
                snapshot.forEach(doc => {
                    const registro = { id: doc.id, ...doc.data() };
                    listaHTML += `<div class="registro-item" data-id="${registro.id}">
                        <span><strong>Paciente:</strong> ${registro.pacienteIniciais || 'N/A'}</span>
                        <span><strong>Psicólogo(a):</strong> ${registro.psicologoNome || 'N/A'}</span>
                        <span><strong>Data:</strong> ${registro.supervisaoData ? new Date(registro.supervisaoData + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</span>
                    </div>`;
                });
            }
            let containerDaLista = supervisionadosContainer.querySelector('#lista-registros');
            if (!containerDaLista) {
                containerDaLista = document.createElement('div');
                containerDaLista.id = 'lista-registros';
                supervisionadosContainer.appendChild(containerDaLista);
            }
            containerDaLista.innerHTML = listaHTML;
        } catch (error) {
            console.error("Erro ao carregar supervisionados:", error);
            supervisionadosContainer.innerHTML += '<p style="color:red;">Erro ao carregar a lista de acompanhamentos.</p>';
        }
    }

    auth.onAuthStateChanged(async user => {
        if (user) {
            currentUser = user;
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().funcoes?.includes('supervisor')) {
                if (!document.getElementById('edit-profile-main-btn')) {
                    const editButton = document.createElement('button');
                    editButton.id = 'edit-profile-main-btn';
                    editButton.className = 'action-button';
                    editButton.textContent = 'Editar Meu Perfil';
                    editButton.style.marginBottom = '20px';
                    editButton.addEventListener('click', () => openEditModal(currentUser.uid));
                    const containerPrincipal = document.querySelector('.admin-panel-container');
                    const refElement = document.getElementById('supervisor-grid-container');
                    if (containerPrincipal && refElement) {
                        containerPrincipal.insertBefore(editButton, refElement);
                    }
                }
                if (supervisionadosContainer) {
                    supervisionadosContainer.addEventListener('click', (e) => {
                        const item = e.target.closest('.registro-item');
                        if (item) {
                            const docId = item.dataset.id;
                            loadFormularioView(docId);
                        }
                    });
                }
                carregarPainelSupervisor();
            } else {
                const mainContainer = document.querySelector('.admin-panel-container');
                if(mainContainer) mainContainer.innerHTML = '<h2>Acesso Negado</h2><p>Esta área é exclusiva para supervisores.</p><a href="../index.html" class="secondary-action-button">&larr; Voltar</a>';
            }
        } else {
            window.location.href = '../index.html';
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
                carregarPainelSupervisor();
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
});
