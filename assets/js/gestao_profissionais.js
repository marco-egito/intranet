(function() {
    if (!db || !auth) {
        console.error("Instâncias do Firebase (db, auth) não encontradas.");
        return;
    }

    // --- VARIÁVEIS GERAIS E CONTROLE DE INICIALIZAÇÃO ---
    const tabContainer = document.querySelector('.tab');
    const inicializado = {
        profissionais: false,
        mensagens: false,
        valores: false
    };

    // --- FUNÇÃO COMPARTILHADA PARA NAVEGAÇÃO DAS ABAS ---
    function openTab(evt, tabName) {
        document.querySelectorAll(".tabcontent").forEach(tc => tc.style.display = "none");
        document.querySelectorAll(".tablinks").forEach(tl => tl.classList.remove("active"));
        const tabElement = document.getElementById(tabName);
        if (tabElement) tabElement.style.display = "block";
        if (evt && evt.currentTarget) {
            evt.currentTarget.classList.add("active");
        }
    }

    // --- LÓGICA DA ABA: GESTÃO DE PROFISSIONAIS ---
    function initGestaoProfissionais() {
        if (inicializado.profissionais) return;
        
        const functions = firebase.functions ? firebase.functions() : null;
        const usuariosCollection = db.collection('usuarios');
        let localUsuariosList = []; 
        
        const tableBody = document.querySelector('#profissionais-table tbody');
        const modal = document.getElementById('profissional-modal');
        const addBtn = document.getElementById('add-profissional-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        const saveBtn = document.getElementById('modal-save-btn');
        const deleteBtn = document.getElementById('modal-delete-btn');
        const form = document.getElementById('profissional-form');

        function openModal(user = null) {
            if (!form || !modal) return;
            form.reset();
            document.getElementById('modal-title').textContent = user ? 'Editar Profissional' : 'Adicionar Profissional';
            document.getElementById('profissional-id').value = user ? user.uid : ''; 
            document.getElementById('prof-email').disabled = !!user;
            
            const senhaGroup = document.getElementById('prof-senha-group');
            if (senhaGroup) senhaGroup.style.display = user ? 'none' : 'block';
            if (deleteBtn) deleteBtn.style.display = user ? 'inline-block' : 'none';

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

        function closeModal() { if (modal) modal.style.display = 'none'; }

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

        usuariosCollection.orderBy("nome").onSnapshot(snapshot => {
            localUsuariosList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderTable(localUsuariosList);
        }, error => {
            window.showToast("Erro ao carregar profissionais.", "error");
            console.error("Erro ao carregar profissionais:", error);
        });

        if (addBtn) addBtn.addEventListener('click', () => openModal(null));
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-row-btn')) {
                    const userId = e.target.dataset.id;
                    const userToEdit = localUsuariosList.find(u => u.uid === userId);
                    if (userToEdit) openModal(userToEdit);
                }
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                const userId = document.getElementById('profissional-id').value;
                if (!userId) { window.showToast('ID do profissional não encontrado.', 'error'); return; }
                if (confirm('Tem certeza que deseja excluir os dados deste profissional? Isso NÃO remove o login dele.')) {
                    usuariosCollection.doc(userId).delete()
                        .then(() => { window.showToast('Profissional excluído com sucesso.', 'success'); closeModal(); })
                        .catch(err => { window.showToast(`Erro ao excluir: ${err.message}`, 'error'); });
                }
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const id = document.getElementById('profissional-id').value;
                const nomeCompleto = document.getElementById('prof-nome').value.trim();
                const usernameInput = document.getElementById('prof-username');
                if (nomeCompleto && usernameInput) {
                    const partes = nomeCompleto.split(/\s+/);
                    let username = partes[0];
                    if (partes.length > 1) username += ' ' + partes[partes.length - 1];
                    usernameInput.value = username;
                }
                const funcoesSelecionadas = Array.from(form.querySelectorAll('input[name="funcoes"]:checked')).map(cb => cb.value);
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

                if (!dadosDoFormulario.nome || !dadosDoFormulario.email) {
                    window.showToast("Nome e E-mail são obrigatórios.", "error"); return;
                }
                saveBtn.disabled = true;
                try {
                    if (id) {
                        await usuariosCollection.doc(id).update(dadosDoFormulario);
                        window.showToast('Profissional atualizado com sucesso!', 'success');
                        closeModal();
                    } else {
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
        
        inicializado.profissionais = true;
    }

    // --- LÓGICA DA ABA: VALORES POR SESSÃO ---
    function initValoresSessao() {
        if (inicializado.valores) return;
        const docRef = db.collection('financeiro').doc('configuracoes');
        const inputOnline = document.getElementById('valor-online');
        const inputPresencial = document.getElementById('valor-presencial');
        const inputTaxa = document.getElementById('taxa-acordo');
        const saveBtn = document.getElementById('salvar-valores-btn');
        async function carregarValores() {
            if (!inputOnline) return;
            try {
                const doc = await docRef.get();
                if (doc.exists) {
                    const data = doc.data();
                    if (data.valores) {
                        inputOnline.value = data.valores.online || 0;
                        inputPresencial.value = data.valores.presencial || 0;
                        inputTaxa.value = data.valores.taxaAcordo || 0;
                    }
                }
            } catch (error) { console.error("Erro ao buscar valores: ", error); window.showToast('Erro ao buscar valores.', 'error'); }
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                saveBtn.disabled = true;
                const novoValorOnline = parseFloat(inputOnline.value) || 0;
                const novoValorPresencial = parseFloat(inputPresencial.value) || 0;
                const novaTaxaAcordo = parseFloat(inputTaxa.value) || 0;
                try {
                    await docRef.set({ valores: { online: novoValorOnline, presencial: novoValorPresencial, taxaAcordo: novaTaxaAcordo }}, { merge: true });
                    window.showToast('Valores salvos com sucesso!', 'success');
                } catch (error) { console.error("Erro ao salvar valores: ", error); window.showToast('Erro ao salvar valores.', 'error');
                } finally { saveBtn.disabled = false; }
            });
        }
        carregarValores();
        inicializado.valores = true;
    }

    // --- LÓGICA DA ABA: MODELOS DE MENSAGEM ---
    function initModelosMensagem() {
        if (inicializado.mensagens) return;
        const docRef = db.collection('financeiro').doc('configuracoes');
        const inputAcordo = document.getElementById('msg-acordo');
        const inputCobranca = document.getElementById('msg-cobranca');
        const inputContrato = document.getElementById('msg-contrato');
        const saveBtn = document.getElementById('salvar-mensagens-btn');
        let modoEdicao = false;
        function setMensagensState(isEditing) {
            if (!inputAcordo) return;
            modoEdicao = isEditing;
            inputAcordo.disabled = !isEditing;
            inputCobranca.disabled = !isEditing;
            inputContrato.disabled = !isEditing;
            saveBtn.textContent = isEditing ? 'Salvar' : 'Modificar';
        }
        async function carregarMensagens() {
            if (!inputAcordo) return;
            try {
                const doc = await docRef.get();
                if (doc.exists) {
                    const data = doc.data();
                    if (data.Mensagens) {
                        inputAcordo.value = data.Mensagens.acordo || '';
                        inputCobranca.value = data.Mensagens.cobranca || '';
                        inputContrato.value = data.Mensagens.contrato || '';
                    }
                }
            } catch (error) { console.error("Erro ao buscar mensagens: ", error); window.showToast('Erro ao buscar mensagens.', 'error'); }
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                if (!modoEdicao) { setMensagensState(true); return; }
                saveBtn.disabled = true;
                const novasMensagens = {
                    'Mensagens.acordo': inputAcordo.value,
                    'Mensagens.cobranca': inputCobranca.value,
                    'Mensagens.contrato': inputContrato.value
                };
                try {
                    await docRef.update(novasMensagens);
                    window.showToast('Mensagens salvas com sucesso!', 'success');
                    setMensagensState(false);
                } catch (error) { console.error("Erro ao salvar mensagens: ", error); window.showToast('Erro ao salvar mensagens.', 'error');
                } finally { saveBtn.disabled = false; }
            });
        }
        carregarMensagens();
        setMensagensState(false);
        inicializado.mensagens = true;
    }

    // --- GERENCIADOR PRINCIPAL DAS ABAS ---
    if (tabContainer) {
        tabContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tablinks')) {
                const tabName = e.target.dataset.tab;
                openTab(e, tabName);
                if (tabName === 'GestaoProfissionais') initGestaoProfissionais();
                else if (tabName === 'ValoresSessao') initValoresSessao();
                else if (tabName === 'ModelosMensagem') initModelosMensagem();
            }
        });
    }

    // Inicializa a primeira aba por padrão
    const primeiraAba = document.querySelector('.tablinks[data-tab="GestaoProfissionais"]');
    if (primeiraAba) {
        primeiraAba.click();
    }
})();
