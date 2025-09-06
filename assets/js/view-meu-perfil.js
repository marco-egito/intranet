// assets/js/view-meu-perfil.js (Versão Final com Upload de Foto)
(function() {
    if (!db || !auth.currentUser) {
        console.error("Firebase não inicializado ou usuário não logado.");
        return;
    }

    // Inicializa o Firebase Storage AQUI
    const storage = firebase.storage();

    const currentUser = auth.currentUser;
    const perfilContainer = document.getElementById('perfil-container');

    // Elementos do Modal de Edição
    const modal = document.getElementById('edit-profile-modal');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const editingUidField = document.getElementById('editing-uid');
    
    // Elementos do Modal para Foto
    const photoFileInput = document.getElementById('photo-file-input');
    const changePhotoBtn = document.getElementById('change-photo-btn');
    const photoPreview = document.getElementById('profile-photo-preview');

    window.openEditModal = async function(uid) {
        if (!uid || !modal) return;
        editingUidField.value = uid;

        try {
            const userDoc = await db.collection('usuarios').doc(uid).get();
            if (!userDoc.exists) { alert("Documento do usuário não foi encontrado."); return; }
            const data = userDoc.data();
            photoPreview.src = data.fotoUrl || '../assets/img/default-user.png';
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
                // Depois de carregar o perfil, se o modal estiver aberto, atualiza a foto lá também
                if (modal && modal.style.display === 'flex') {
                    const data = doc.data();
                    photoPreview.src = data.fotoUrl || '../assets/img/default-user.png';
                }
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

    // Listeners do Modal (Salvar/Cancelar)
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
                carregarMeuPerfil(); 
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

    // --- LÓGICA DE UPLOAD DA FOTO (AGORA AQUI!) ---
    if (changePhotoBtn && photoFileInput) {
        changePhotoBtn.addEventListener('click', () => {
            photoFileInput.click();
        });
        photoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadProfilePhoto(file);
            }
        });
    }

    async function uploadProfilePhoto(file) {
        const uidToEdit = editingUidField.value;
        if (!uidToEdit) { alert("Erro: ID do usuário não encontrado para o upload da foto."); return; }
        if (!file.type.startsWith('image/')) { alert("Por favor, selecione um arquivo de imagem (jpg, png, etc)."); return; }
        if (file.size > 5 * 1024 * 1024) { alert("O arquivo de imagem é muito grande. O máximo permitido é 5MB."); return; }

        changePhotoBtn.disabled = true;
        changePhotoBtn.textContent = 'Enviando...';
        const filePath = `profile_photos/${uidToEdit}/${Date.now()}_${file.name}`;
        const storageRef = storage.ref(filePath);
        try {
            const uploadTask = await storageRef.put(file);
            const downloadURL = await uploadTask.ref.getDownloadURL();
            await db.collection('usuarios').doc(uidToEdit).update({ fotoUrl: downloadURL });
            photoPreview.src = downloadURL; // Atualiza a pré-visualização no modal
            alert("Foto de perfil atualizada com sucesso!");
            carregarMeuPerfil(); // Recarrega o perfil para exibir a nova foto no card principal
        } catch (error) {
            console.error("Erro no upload da foto:", error);
            alert("Ocorreu um erro ao enviar a foto. Tente novamente.");
        } finally {
            changePhotoBtn.disabled = false;
            changePhotoBtn.textContent = 'Alterar Foto';
            photoFileInput.value = '';
        }
    }

    carregarMeuPerfil();
})();
