(function() {
    if (!db || !auth || !firebase.functions) {
        console.error("Instâncias do Firebase (db, auth, functions) não encontradas. Verifique se todos os scripts do Firebase foram carregados no painel.html.");
        return;
    }

    // --- INICIALIZAÇÃO E VARIÁVEIS GERAIS ---
    const functions = firebase.functions(); // Inicializa o serviço de Cloud Functions
    const usuariosCollection = db.collection('usuarios');
    let localUsuariosList = []; 
    
    const tableBody = document.querySelector('#profissionais-table tbody');
    const modal = document.getElementById('profissional-modal');
    const addBtn = document.getElementById('add-profissional-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const saveBtn = document.getElementById('modal-save-btn');
    const deleteBtn = document.getElementById('modal-delete-btn');
    const form = document.getElementById('profissional-form');
    const tabContainer = document.querySelector('.tab');

    // --- FUNÇÕES AUXILIARES E DE RENDERIZAÇÃO ---
    function openTab(evt, tabName) {
        document.querySelectorAll(".tabcontent").forEach(tc => tc.style.display = "none");
        document.querySelectorAll(".tablinks").forEach(tl => tl.classList.remove("active"));
        const tabElement = document.getElementById(tabName);
        if (tabElement) tabElement.style.display = "block";
        if (evt && evt.currentTarget) {
            evt.currentTarget.classList.add("active");
        }
    }

    function openModal(user = null) {
        if (!form || !modal) return;
        form.reset();
        document.getElementById('modal-title').textContent = user ? 'Editar Profissional' : 'Adicionar Profissional';
        document.getElementById('profissional-id').value = user ? user.id : '';
        document.getElementById('prof-email').disabled = !!user;

        const senhaGroup = document.getElementById('prof-senha-group'); // Assumindo que você criará uma div com este ID
        if (senhaGroup) {
            senhaGroup.style.display = user ? 'none' : 'block';
        }
        if (deleteBtn) {
            deleteBtn.style.display = user ? 'inline-block' : 'none';
        }

        if (user) {
            document.getElementById('prof-nome').value = user.nome || '';
            document.getElementById('prof-email').value = user.email || '';
            document.getElementById('prof-contato').value = user.contato || '';
            document.getElementById('prof-inativo').checked = user.inativo || false;
            document.getElementById('prof-username').value = user.username || '';
            document.getElementById('prof-profissao').value = user.profissao || '';
            document.getElementById('prof-recebeDireto').checked = user.recebeDireto || false;
            document.getElementById('prof-primeiraFase').checked = user.primeiraFase || false;
            document.getElementById('prof-fazAtendimento').checked = user.fazAtendimento || false;
            form.querySelectorAll('input[name="funcoes"]').forEach(checkbox => {
                checkbox.checked = user.funcoes && user.funcoes.includes(checkbox.value);
            });
        }
        modal.style.display = 'block';
    }

    function closeModal() {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function renderTable(users) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8">Nenhum profissional encontrado.</td></tr>';
            return;
        }
        users.forEach(user => {
            const row = tableBody.insertRow();
            const funcoesStr = (user.funcoes || []).join(', ') || 'Nenhuma';
            row.innerHTML = `
                <td>${user.nome || ''}</td>
                <td>${user.contato || ''}</td>
                <td>${funcoesStr}</td>
                <td>${user.inativo ? 'Sim' : 'Não'}</td>
                <td>${user.primeiraFase ? 'Sim' : 'Não'}</td>
                <td>${user.fazAtendimento ? 'Sim' : 'Não'}</td>
                <td>${user.recebeDireto ? 'Sim' : 'Não'}</td>
                <td><button class="action-button edit-row-btn" data-id="${user.uid}">Editar</button></td>
            `;
        });
    }

    // --- LISTENER DE DADOS EM TEMPO REAL ---
    usuariosCollection.orderBy("nome").onSnapshot(snapshot => {
        localUsuariosList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTable(localUsuariosList);
    }, error => {
        console.error("Erro ao carregar profissionais:", error);
        window.showToast("Erro ao carregar a lista de profissionais.", "error");
    });

    // --- EVENT LISTENERS PARA OS BOTÕES E ABAS ---
    if (tabContainer) {
        tabContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tablinks')) {
                openTab(e, e.target.dataset.tab);
            }
        });
    }
    
    if (addBtn) {
        addBtn.addEventListener('click', () => openModal(null));
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-row-btn')) {
                const userId = e.target.dataset.id;
                const userToEdit = localUsuariosList.find(u => u.uid === userId);
                if (userToEdit) {
                    openModal(userToEdit);
                }
            }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const userId = document.getElementById('profissional-id').value;
            if (!userId) {
                window.showToast('ID do profissional não encontrado.', 'error');
                return;
            }
            if (confirm('Tem certeza que deseja excluir este profissional? Esta ação não pode ser desfeita.')) {
                usuariosCollection.doc(userId).delete()
                    .then(() => {
                        window.showToast('Profissional excluído com sucesso.', 'success');
                        closeModal();
                    })
                    .catch(err => {
                        window.showToast(`Erro ao excluir: ${err.message}`, 'error');
                    });
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const id = document.getElementById('profissional-id').value;
            const nomeCompletoInput = document.getElementById('prof-nome');
            const usernameInput = document.getElementById('prof-username');
            
            // Lógica de username automático
            const nomeCompleto = nomeCompletoInput.value.trim();
            if (nomeCompleto && usernameInput) {
                const partes = nomeCompleto.split(/\s+/);
                let username = partes[0];
                if (partes.length > 1) {
                    username += ' ' + partes[partes.length - 1];
                }
                usernameInput.value = username;
            }
            
            const funcoesSelecionadas = [];
            form.querySelectorAll('input[name="funcoes"]:checked').forEach(cb => funcoesSelecionadas.push(cb.value));
            
            const dadosDoFormulario = {
                nome: nomeCompleto,
                email: document.getElementById('prof-email').value.trim(),
                contato: document.getElementById('prof-contato').value.trim(),
                inativo: document.getElementById('prof-inativo').checked,
                funcoes: funcoesSelecionadas,
                username: usernameInput.value.trim(),
                profissao: document.getElementById('prof-profissao').value,
                recebeDireto: document.getElementById('prof-recebeDireto').checked,
                primeiraFase: document.getElementById('prof-primeiraFase').checked,
                fazAtendimento: document.getElementById('prof-fazAtendimento').checked,
            };

            saveBtn.disabled = true;

            try {
                if (id) {
                    // MODO EDIÇÃO: Atualiza diretamente no Firestore
                    await usuariosCollection.doc(id).update(dadosDoFormulario);
                    window.showToast('Profissional atualizado com sucesso!', 'success');
                    closeModal();
                } else {
                    // MODO CRIAÇÃO: Chama a Cloud Function
                    if (!functions) throw new Error("Serviço de Cloud Functions não inicializado.");
                    
                    dadosDoFormulario.senha = document.getElementById('prof-senha').value;
                    
                    if (!dadosDoFormulario.senha || dadosDoFormulario.senha.length < 6) {
                        throw new Error("A senha inicial é obrigatória (mínimo 6 caracteres).");
                    }

                    const criarNovoProfissional = functions.httpsCallable('criarNovoProfissional');
                    const resultado = await criarNovoProfissional(dadosDoFormulario);
                    
                    window.showToast(resultado.data.message, 'success');
                    closeModal();
                }
            } catch (error) {
                console.error("Erro ao salvar:", error);
                window.showToast(`Erro: ${error.message}`, 'error');
            } finally {
                saveBtn.disabled = false;
            }
        });
    }

    // Inicializa a primeira aba
    if (document.querySelector('.tablinks[data-tab="GestaoProfissionais"]')) {
      document.querySelector('.tablinks[data-tab="GestaoProfissionais"]').click();
    }
})();
