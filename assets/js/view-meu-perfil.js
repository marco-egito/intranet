// assets/js/view-meu-perfil.js (Versão Final Corrigida)
(function() {
    if (!db || !auth.currentUser) {
        console.error("Firebase não inicializado ou usuário não logado.");
        return;
    }

    const currentUser = auth.currentUser;
    const perfilContainer = document.getElementById('perfil-container');

    // Elementos do Modal de Edição (agora pertencem a este script)
    const modal = document.getElementById('edit-profile-modal');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const editingUidField = document.getElementById('editing-uid');

    // A função de abrir o modal agora é definida e usada aqui
    window.openEditModal = async function(uid) {
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

    function closeEditModal() {
        if (modal) modal.style.display = 'none';
    }
    
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

    async function carregarMeuPerfil() {
        if (!perfilContainer) return;
        try {
            const doc = await db.collection('usuarios').doc(currentUser.uid).get();
            if (doc.exists) {
                perfilContainer.innerHTML = criarCardSupervisor(doc.data());
            } else {
                perfilContainer.innerHTML = '<p>Seu perfil não foi encontrado.</p>';
            }
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            perfilContainer.innerHTML = '<p style="color:red;">Ocorreu um erro ao carregar seu perfil.</p>';
        }
    }

    const editButton = document.getElementById('edit-profile-main-btn');
    if (editButton) {
        editButton.addEventListener('click', () => {
            if (window.openEditModal) {
                window.openEditModal(currentUser.uid);
            }
        });
    }

    // Listeners do Modal
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
                carregarMeuPerfil(); // Apenas recarrega o perfil
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

    carregarMeuPerfil();
})();
