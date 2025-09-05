// assets/js/supervisores.js (Versão 2 - Completo com Edição de Perfil)
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

(function() {
    const container = document.getElementById('supervisor-grid-container');
    let currentUser = null; // Guarda o usuário logado

    // Elementos do Modal
    const modal = document.getElementById('edit-profile-modal');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');

    // Função que abre o modal e carrega os dados do supervisor logado
    async function openEditModal() {
        if (!currentUser || !modal) return;

        try {
            const userDoc = await db.collection('usuarios').doc(currentUser.uid).get();
            if (!userDoc.exists) {
                alert("Seu documento de usuário não foi encontrado.");
                return;
            }
            const data = userDoc.data();

            // Preenche o formulário com os dados existentes
            document.getElementById('edit-formacao').value = data.formacao || '';
            // Converte arrays em texto com uma quebra de linha
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
        if(modal) modal.style.display = 'none';
    }

    async function carregarSupervisores() {
        if (!container) return;

        try {
            const query = db.collection('usuarios')
                .where('funcoes', 'array-contains', 'supervisor')
                .where('inativo', '!=', true)
                .orderBy('nome');
                
            const snapshot = await query.get();
            container.innerHTML = ''; // Limpa o spinner de carregamento

            if (snapshot.empty) {
                container.innerHTML = '<p>Nenhum supervisor encontrado.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const prof = doc.data();
                const cardHTML = criarCardSupervisor(prof);
                container.innerHTML += cardHTML;
            });

        } catch (error) {
            console.error("Erro ao carregar supervisores:", error);
            container.innerHTML = '<p style="color:red;">Erro ao carregar la lista de supervisores.</p>';
        }
    }
    
    function criarCardSupervisor(prof) {
        // Gera o HTML para cada seção, apenas se os dados existirem no Firestore
        const especializacaoHTML = (prof.especializacao || []).map(item => `<li>${item}</li>`).join('');
        const atuacaoHTML = (prof.atuacao || []).map(item => `<li>${item}</li>`).join('');
        const supervisaoHTML = (prof.supervisaoInfo || []).map(item => `<li>${item}</li>`).join('');
        const horariosHTML = (prof.diasHorarios || []).map(item => `<li>${item}</li>`).join('');

        return `
            <div class="supervisor-card">
                <div class="supervisor-card-left">
                    <h2>${prof.nome || 'Nome não informado'}</h2>
                    <h3>SUPERVISORA</h3>
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

    // --- LÓGICA PRINCIPAL E EVENT LISTENERS ---
    
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
                    editButton.addEventListener('click', openEditModal);
                    // Insere o botão antes da grade de supervisores
                    if (container && container.parentNode) {
                       container.parentNode.insertBefore(editButton, container);
                    }
                }
            }
            carregarSupervisores();
        } else {
            currentUser = null;
            carregarSupervisores(); // Carrega os cards mesmo se não estiver logado, mas sem o botão de editar
        }
    });

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            if (!currentUser) return;
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

                await db.collection('usuarios').doc(currentUser.uid).update(dataToUpdate);
                alert("Perfil atualizado com sucesso!");
                closeEditModal();
                carregarSupervisores();
            } catch (error) {
                console.error("Erro ao salvar perfil:", error);
                alert("Ocorreu um erro ao salvar seu perfil.");
            } finally {
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = 'Salvar Alterações';
            }
        });
    }

    if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);
    if (closeModalBtns) closeModalBtns.forEach(btn => btn.addEventListener('click', closeEditModal));
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                closeEditModal();
            }
        });
    }

})();
