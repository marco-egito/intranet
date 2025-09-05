// assets/js/formulario-supervisao.js (Versão 1)
(function() {
    if (!db || !auth.currentUser) {
        console.error("Firestore ou usuário não autenticado não encontrado.");
        document.getElementById('supervisao-view').innerHTML = '<h2>Erro de autenticação. Por favor, recarregue a página.</h2>';
        return;
    }

    const currentUser = auth.currentUser;
    const supervisaoCollection = db.collection('supervisao');
    
    // Elementos da UI
    const showFormBtn = document.getElementById('show-form-btn');
    const formContainer = document.getElementById('form-container');
    const form = document.getElementById('ficha-supervisao');
    const saveStatus = document.getElementById('save-status');
    const supervisorSelect = document.getElementById('supervisor-nome');
    const psicologoSelect = document.getElementById('psicologo-nome');
    const listaRegistros = document.getElementById('lista-registros');
    const deleteBtn = document.getElementById('delete-btn');
    const documentIdField = document.getElementById('document-id');

    let debounceTimer;

    // Carrega a lista inicial de supervisores e psicólogos
    async function popularSelects() {
        try {
            const supervisoresQuery = db.collection('usuarios').where('funcoes', 'array-contains', 'supervisor').where('inativo', '!=', true);
            const psicologosQuery = db.collection('usuarios').where('fazAtendimento', '==', true).where('inativo', '!=', true);

            const [supervisoresSnapshot, psicologosSnapshot] = await Promise.all([
                supervisoresQuery.get(),
                psicologosQuery.get()
            ]);

            supervisorSelect.innerHTML = '<option value="">Selecione um supervisor</option>';
            psicologoSelect.innerHTML = '<option value="">Selecione um psicólogo</option>';

            supervisoresSnapshot.forEach(doc => {
                const user = doc.data();
                supervisorSelect.innerHTML += `<option value="${user.uid}">${user.nome}</option>`;
            });

            psicologosSnapshot.forEach(doc => {
                const user = doc.data();
                psicologoSelect.innerHTML += `<option value="${user.uid}">${user.nome}</option>`;
            });
        } catch (error) {
            console.error("Erro ao popular selects:", error);
            supervisorSelect.innerHTML = '<option value="">Erro ao carregar</option>';
            psicologoSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    // Carrega os registros que o usuário logado pode ver
    async function carregarRegistros() {
        listaRegistros.innerHTML = '<p>Carregando...</p>';
        try {
            // Duas buscas: uma para registros onde ele é o psicólogo, outra onde ele é o supervisor
            const comoPsicologoQuery = supervisaoCollection.where('psicologoUid', '==', currentUser.uid);
            const comoSupervisorQuery = supervisaoCollection.where('supervisorUid', '==', currentUser.uid);

            const [psicologoSnapshot, supervisorSnapshot] = await Promise.all([
                comoPsicologoQuery.get(),
                comoSupervisorQuery.get()
            ]);

            const registrosMap = new Map();
            psicologoSnapshot.forEach(doc => registrosMap.set(doc.id, { id: doc.id, ...doc.data() }));
            supervisorSnapshot.forEach(doc => registrosMap.set(doc.id, { id: doc.id, ...doc.data() }));

            listaRegistros.innerHTML = '';
            if (registrosMap.size === 0) {
                listaRegistros.innerHTML = '<p>Nenhum acompanhamento encontrado.</p>';
                return;
            }

            registrosMap.forEach(registro => {
                const div = document.createElement('div');
                div.className = 'registro-item';
                div.dataset.id = registro.id;
                div.innerHTML = `
                    <span><strong>Paciente:</strong> ${registro.pacienteIniciais || 'N/A'}</span>
                    <span><strong>Psicólogo(a):</strong> ${registro.psicologoNome || 'N/A'}</span>
                    <span><strong>Data:</strong> ${registro.supervisaoData || 'N/A'}</span>`;
                listaRegistros.appendChild(div);
            });

        } catch (error) {
            console.error("Erro ao carregar registros:", error);
            listaRegistros.innerHTML = '<p style="color:red;">Ocorreu um erro ao buscar os dados.</p>';
        }
    }
    
    // Preenche o formulário com os dados de um registro existente
    function preencherFormulario(dados) {
        form.reset();
        documentIdField.value = dados.id || '';

        for (const key in dados) {
            const field = form.elements[key];
            if (field) {
                // Lida com a seleção correta nos <select>
                if (field.tagName === 'SELECT') {
                    // O valor salvo é o UID, então usamos isso para selecionar a option
                    const uidToSelect = key === 'psicologoNome' ? dados.psicologoUid : dados.supervisorUid;
                    field.value = uidToSelect;
                } else {
                    field.value = dados[key];
                }
            }
        }
        
        formContainer.style.display = 'block';
        showFormBtn.style.display = 'none';
        deleteBtn.style.display = 'block';
        document.getElementById('paciente-iniciais').disabled = true; // Impede a alteração da chave de identificação do caso
    }

    // Salva os dados do formulário (cria um novo ou atualiza um existente)
    const autoSaveForm = async () => {
        const pacienteIniciais = form.elements['pacienteIniciais'].value.trim();
        if (!pacienteIniciais) {
            saveStatus.textContent = 'Preencha as iniciais do paciente para salvar.';
            return;
        }
        
        saveStatus.textContent = 'Salvando...';
        const formData = new FormData(form);
        const dataToSave = Object.fromEntries(formData.entries());

        // Adiciona os UIDs para as regras de segurança
        dataToSave.psicologoUid = psicologoSelect.value;
        dataToSave.supervisorUid = supervisorSelect.value;

        // Adiciona os nomes para fácil visualização na lista
        dataToSave.psicologoNome = psicologoSelect.options[psicologoSelect.selectedIndex]?.text || '';
        dataToSave.supervisorNome = supervisorSelect.options[supervisorSelect.selectedIndex]?.text || '';

        try {
            const docId = documentIdField.value;
            if (docId) { // Atualiza um documento existente
                await supervisaoCollection.doc(docId).set(dataToSave, { merge: true });
            } else { // Cria um novo documento
                const newDocRef = await supervisaoCollection.add(dataToSave);
                documentIdField.value = newDocRef.id; // Atualiza o ID no campo oculto para os próximos salvamentos
            }
            saveStatus.textContent = 'Salvo ✓';
            setTimeout(() => { saveStatus.textContent = ''; }, 2500);
        } catch (error) {
            console.error("Erro ao salvar:", error);
            saveStatus.textContent = 'Erro ao salvar!';
        }
    };

    // --- Event Listeners ---
    showFormBtn.addEventListener('click', () => {
        form.reset();
        documentIdField.value = '';
        formContainer.style.display = 'block';
        showFormBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        document.getElementById('paciente-iniciais').disabled = false;
    });

    listaRegistros.addEventListener('click', async (e) => {
        const item = e.target.closest('.registro-item');
        if (item) {
            const docId = item.dataset.id;
            const docSnap = await supervisaoCollection.doc(docId).get();
            if (docSnap.exists()) {
                preencherFormulario({ id: docId, ...docSnap.data() });
            }
        }
    });

    form.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(autoSaveForm, 2000); // Salva 2 segundos após a última digitação
    });

    deleteBtn.addEventListener('click', async () => {
        const docId = documentIdField.value;
        if (docId && confirm("Tem certeza que deseja excluir este acompanhamento? Esta ação não pode ser desfeita.")) {
            try {
                await supervisaoCollection.doc(docId).delete();
                alert("Registro excluído com sucesso.");
                showSupervisaoDashboard(); // Volta para a tela de cards
                carregarRegistros(); // Recarrega a lista
            } catch (error) {
                alert("Erro ao excluir o registro.");
                console.error("Erro ao excluir:", error);
            }
        }
    });

    // Inicialização da página
    popularSelects();
    carregarRegistros();
})();
