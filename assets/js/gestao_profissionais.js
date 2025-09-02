(function() {
    if (!db || !auth) {
        console.error("Instâncias do Firebase (db, auth) não encontradas.");
        return;
    }

    const usuariosCollection = db.collection('usuarios');
    let localUsuariosList = []; 
    
    const tableBody = document.querySelector('#profissionais-table tbody');
    const modal = document.getElementById('profissional-modal');
    const addBtn = document.getElementById('add-profissional-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const saveBtn = document.getElementById('modal-save-btn');
    const form = document.getElementById('profissional-form');
    const tabContainer = document.querySelector('.tab');
    const deleteBtn = document.getElementById('modal-delete-btn'); // Nova variável para o botão

    const nomeCompletoInput = document.getElementById('prof-nome');
    const usernameInput = document.getElementById('prof-username');

    if (nomeCompletoInput && usernameInput) {
        nomeCompletoInput.addEventListener('blur', () => {
            const nomeCompleto = nomeCompletoInput.value.trim();
            if (nomeCompleto) {
                const partes = nomeCompleto.split(/\s+/);
                let username = partes[0];
                if (partes.length > 1) {
                    username += ' ' + partes[partes.length - 1];
                }
                usernameInput.value = username;
            }
        });
    }

    function openTab(evt, tabName) {
        document.querySelectorAll(".tabcontent").forEach(tc => tc.style.display = "none");
        document.querySelectorAll(".tablinks").forEach(tl => tl.classList.remove("active"));
        const tabElement = document.getElementById(tabName);
        if(tabElement) tabElement.style.display = "block";
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
    
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.4s ease';
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    function renderTable(users) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (users.length === 0) {
            // COLSPAN ATUALIZADO PARA 8 COLUNAS
            tableBody.innerHTML = '<tr><td colspan="8">Nenhum profissional encontrado.</td></tr>';
            return;
        }
        users.forEach(user => {
            const row = tableBody.insertRow();
            const funcoesStr = (user.funcoes || []).join(', ') || 'Nenhuma';

            // CONTEÚDO DA LINHA ATUALIZADO PARA REFLETIR AS NOVAS COLUNAS
            row.innerHTML = `
                <td>${user.nome || ''}</td>
                <td>${user.contato || ''}</td>
                <td>${funcoesStr}</td>
                <td>${user.inativo ? 'Sim' : 'Não'}</td>
                <td>${user.primeiraFase ? 'Sim' : 'Não'}</td>
                <td>${user.fazAtendimento ? 'Sim' : 'Não'}</td>
                <td>${user.recebeDireto ? 'Sim' : 'Não'}</td>
                <td>
                    <button class="action-button edit-row-btn" data-id="${user.id}">Editar</button>
                </td>
            `;
        });
    }

    const unsubscribe = usuariosCollection.orderBy("nome").onSnapshot(snapshot => {
        localUsuariosList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTable(localUsuariosList);
    }, error => {
        console.error("ERRO DETALHADO AO CARREGAR PROFISSIONAIS:", error);
        showToast("Erro ao carregar dados.", "error");
    });

    if (tabContainer) {
        tabContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tablinks')) {
                openTab(e, e.target.dataset.tab);
            }
        });
    }
    
    if (addBtn) {
        addBtn.addEventListener('click', () => openModal());
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const nomeCompleto = document.getElementById('prof-nome').value.trim();
            const usernameInput = document.getElementById('prof-username');
            if (nomeCompleto) {
                const partes = nomeCompleto.split(/\s+/);
                let username = partes[0];
                if (partes.length > 1) {
                    username += ' ' + partes[partes.length - 1];
                }
                usernameInput.value = username;
            }

            const id = document.getElementById('profissional-id').value;
            const funcoesSelecionadas = [];
            form.querySelectorAll('input[name="funcoes"]:checked').forEach(cb => funcoesSelecionadas.push(cb.value));
            
            const userData = {
                nome: nomeCompleto,
                email: document.getElementById('prof-email').value.trim(),
                contato: document.getElementById('prof-contato').value.trim(),
                inativo: document.getElementById('prof-inativo').checked,
                funcoes: funcoesSelecionadas,
                username: document.getElementById('prof-username').value.trim(),
                profissao: document.getElementById('prof-profissao').value,
                recebeDireto: document.getElementById('prof-recebeDireto').checked,
                primeiraFase: document.getElementById('prof-primeiraFase').checked,
                fazAtendimento: document.getElementById('prof-fazAtendimento').checked,
            };

            if (!userData.nome || !userData.email) {
                showToast('Nome e E-mail são obrigatórios.', 'error');
                return;
            }
            if (!userData.profissao) {
                showToast('O campo Profissão é obrigatório.', 'error');
                return;
            }

            saveBtn.disabled = true;
            try {
                if (id) {
                    await usuariosCollection.doc(id).update(userData);
                    showToast('Profissional atualizado com sucesso!', 'success');
                } else {
                    await usuariosCollection.add(userData);
                    showToast('Profissional adicionado ao banco de dados!', 'success');
                }
                closeModal();
            } catch (error) {
                console.error("Erro ao salvar no Firestore:", error);
                showToast(`Erro ao salvar: ${error.message}`, 'error');
            } finally {
                saveBtn.disabled = false;
            }
        });
    }

        // NOVO EVENT LISTENER PARA O BOTÃO EXCLUIR DO MODAL
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const userId = document.getElementById('profissional-id').value;
            if (!userId) {
                showToast('ID do profissional não encontrado.', 'error');
                return;
            }

            if (confirm('Tem certeza que deseja excluir este profissional? Esta ação não pode ser desfeita.')) {
                usuariosCollection.doc(userId).delete()
                    .then(() => {
                        showToast('Profissional excluído com sucesso.', 'success');
                        closeModal();
                    })
                    .catch(err => {
                        showToast(`Erro ao excluir: ${err.message}`, 'error');
                        console.error("Erro ao excluir:", err);
                    });
            }
        });
    }


    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const target = e.target;
            const userId = target.dataset.id;
            if (!userId) return;
            if (target.classList.contains('edit-row-btn')) {
                const userToEdit = localUsuariosList.find(u => u.id === userId);
                if (userToEdit) openModal(userToEdit);
            }
            if (target.classList.contains('delete-row-btn')) {
                if (confirm('Tem certeza que deseja excluir este profissional?')) {
                    usuariosCollection.doc(userId).delete()
                        .then(() => showToast('Profissional excluído.', 'success'))
                        .catch(err => showToast(`Erro: ${err.message}`, 'error'));
                }
            }
        });
    }
    
    if (document.querySelector('.tablinks[data-tab="GestaoProfissionais"]')) {
      document.querySelector('.tablinks[data-tab="GestaoProfissionais"]').click();
    }
})();
