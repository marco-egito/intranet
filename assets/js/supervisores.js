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

// Funções globais para serem chamadas pelos botões "Voltar" nas views carregadas
window.showSupervisorDashboard = function() {
    document.getElementById('view-content-area').style.display = 'none';
    document.getElementById('supervisor-dashboard-content').style.display = 'block';
};

window.openEditModal = async function(uid) {
    const modal = document.getElementById('edit-profile-modal');
    const editingUidField = document.getElementById('editing-uid');
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
};

document.addEventListener('DOMContentLoaded', function() {
    if (!auth) return;

    const dashboardContent = document.getElementById('supervisor-dashboard-content');
    const viewContentArea = document.getElementById('view-content-area');
    const supervisorCardsGrid = document.getElementById('supervisor-cards-grid');
    let currentUserData = {};

    const icons = {
        profile: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
        list: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`
    };
    
    async function loadView(viewName) {
        dashboardContent.style.display = 'none';
        viewContentArea.style.display = 'block';
        viewContentArea.innerHTML = '<div class="loading-spinner"></div>';
        
        const fileMap = {
            'meu_perfil': { html: './view-meu-perfil.html', js: '../assets/js/view-meu-perfil.js' },
            'meus_supervisionados': { html: './view-meus-supervisionados.html', js: '../assets/js/view-meus-supervisionados.js' }
        };
        const files = fileMap[viewName];

        try {
            const response = await fetch(files.html);
            if (!response.ok) throw new Error (`HTML não encontrado: ${files.html}`);
            viewContentArea.innerHTML = await response.text();
            
            const existingScript = document.querySelector(`script[data-view-script="${viewName}"]`);
            if (existingScript) existingScript.remove();
            
            const script = document.createElement('script');
            script.src = files.js;
            script.dataset.viewScript = viewName;
            document.body.appendChild(script);
        } catch (error) {
            console.error("Erro ao carregar view:", error);
            viewContentArea.innerHTML = `<h2>Erro ao carregar.</h2><button onclick="showSupervisorDashboard()">Voltar</button>`;
        }
    }

    function renderSupervisorCards() {
        supervisorCardsGrid.innerHTML = '';
        const modules = {
            meu_perfil: { titulo: 'Meu Perfil e Edição', descricao: 'Visualize e edite suas informações de perfil.', icon: icons.profile },
            meus_supervisionados: { titulo: 'Meus Supervisionados', descricao: 'Visualize os acompanhamentos que você supervisiona.', icon: icons.list }
        };
        for(const key in modules) {
            const module = modules[key];
            const card = document.createElement('div');
            card.className = 'module-card';
            card.dataset.view = key;
            card.innerHTML = `<div class="card-icon">${module.icon}</div><div class="card-content"><h3>${module.titulo}</h3><p>${module.descricao}</p></div>`;
            supervisorCardsGrid.appendChild(card);
        }
    }
    
    supervisorCardsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.module-card');
        if (card) {
            loadView(card.dataset.view);
        }
    });

    auth.onAuthStateChanged(async user => {
        if (user) {
            try {
                const userDoc = await db.collection('usuarios').doc(user.uid).get();
                if (userDoc.exists && userDoc.data().funcoes?.includes('supervisor')) {
                    renderSupervisorCards();
                } else {
                    dashboardContent.innerHTML = '<h2>Acesso Negado</h2><p>Esta área é exclusiva para supervisores.</p>';
                }
            } catch (error) {
                 dashboardContent.innerHTML = '<h2>Erro ao verificar permissões.</h2>';
            }
        } else {
            window.location.href = '../index.html';
        }
    });

    const modal = document.getElementById('edit-profile-modal');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const editingUidField = document.getElementById('editing-uid');

    if(cancelBtn) cancelBtn.addEventListener('click', () => modal.style.display = 'none');
    if(closeModalBtns) closeModalBtns.forEach(btn => btn.addEventListener('click', () => modal.style.display = 'none'));
    if(modal) modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

    if(saveProfileBtn) {
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
                modal.style.display = 'none';
                
                // Recarrega a view de perfil se ela estiver aberta
                if (document.querySelector('#perfil-container')) {
                    const script = document.createElement('script');
                    script.src = '../assets/js/view-meu-perfil.js';
                    document.body.appendChild(script);
                }

            } catch (error) {
                console.error("Erro ao salvar perfil:", error);
                alert("Ocorreu um erro ao salvar o perfil.");
            } finally {
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = 'Salvar Alterações';
            }
        });
    }
});
