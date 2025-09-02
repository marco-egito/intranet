(function() {
    // As variáveis `db` e `auth` já existem globalmente, carregadas pelo painel-script.js
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

    // --- Funções Auxiliares (Modal, Toast, Abas) ---
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

        if (user) {
            document.getElementById('prof-nome').value = user.nome || '';
            document.getElementById('prof-email').value = user.email || '';
            document.getElementById('prof-contato').value = user.contato || '';
            document.getElementById('prof-inativo').checked = user.inativo || false;
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

    // --- Lógica de Dados (Firestore) ---
    function renderTable(users) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">Nenhum profissional encontrado.</td></tr>';
            return;
        }
        users.forEach(user => {
            const row = tableBody.insertRow();
            const funcoesStr = (user.funcoes || []).join(', ') || 'Nenhuma';
            row.innerHTML = `
                <td>${user.nome || ''}</td>
                <td>${user.email || ''}</td>
                <td>${user.contato || ''}</td>
                <td>${funcoesStr}</td>
                <td>${user.inativo ? 'Sim' : 'Não'}</td>
                <td>
                    <button class="action-button edit-row-btn" data-id="${user.id}">Editar</button>
                    <button class="action-button delete-row-btn" data-id="${user.id}">Excluir</button>
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

    // --- Event Listeners (COM A CORREÇÃO) ---
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
            const id = document.getElementById('profissional-id').value;
            const funcoesSelecionadas = [];
            form.querySelectorAll('input[name="funcoes"]:checked').forEach(cb => funcoesSelecionadas.push(cb.value));
            const userData = {
                nome: document.getElementById('prof-nome').value.trim(),
                email: document.getElementById('prof-email').value.trim(),
                contato: document.getElementById('prof-contato').value.trim(),
                inativo: document.getElementById('prof-inativo').checked,
                funcoes: funcoesSelecionadas
            };
            if (!userData.nome || !userData.email) {
                showToast('Nome e E-mail são obrigatórios.', 'error');
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
                showToast(`Erro ao salvar: ${error.message}`, 'error');
            } finally {
                saveBtn.disabled = false;
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
    
    // Inicializa a primeira aba
    if (document.querySelector('.tablinks[data-tab="GestaoProfissionais"]')) {
      document.querySelector('.tablinks[data-tab="GestaoProfissionais"]').click();
    }
})();
