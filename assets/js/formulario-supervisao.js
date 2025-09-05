// assets/js/formulario-supervisao.js (Versão 4 - Corrigido)
(function() {
    if (!db || !auth.currentUser) {
        console.error("Firestore ou usuário não autenticado não encontrado.");
        const view = document.getElementById('supervisao-view');
        if(view) view.innerHTML = '<h2>Erro de autenticação. Por favor, recarregue a página.</h2>';
        return;
    }

    const currentUser = auth.currentUser;
    const supervisaoCollection = db.collection('supervisao');
    
    const listaContainer = document.getElementById('lista-acompanhamentos-container');
    const formContainer = document.getElementById('form-container');
    const form = document.getElementById('ficha-supervisao');
    const saveStatus = document.getElementById('save-status');
    const supervisorSelect = document.getElementById('supervisor-nome');
    const psicologoSelect = document.getElementById('psicologo-nome');
    const listaRegistros = document.getElementById('lista-registros');
    const deleteBtn = document.getElementById('delete-btn');
    const documentIdField = document.getElementById('document-id');
    const filtrosContainer = document.getElementById('filtros-container');
    const filtroSupervisorView = document.getElementById('filtro-supervisor-view');
    const filtroPsicologoSelect = document.getElementById('filtro-psicologo');
    const filtroPacienteInput = document.getElementById('filtro-paciente');
    
    let todosOsRegistros = [];
    let isSupervisor = false;
    let debounceTimer;

    function debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    async function popularSelects() {
        try {
            const supervisoresQuery = db.collection('usuarios').where('funcoes', 'array-contains', 'supervisor').where('inativo', '!=', true);
            const psicologosQuery = db.collection('usuarios')
                .where('profissao', 'in', ['Psicólogo', 'Psicopedagoga', 'Musicoterapeuta'])
                .where('inativo', '!=', true);

            // --- LINHA CORRIGIDA ABAIXO ---
            const [supervisoresSnapshot, psicologosSnapshot] = await Promise.all([
                supervisoresQuery.get(),
                psicologosQuery.get() // Estava com o nome errado aqui
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

    function renderizarLista(registrosParaRenderizar) {
        listaRegistros.innerHTML = '';
        if (registrosParaRenderizar.length === 0) {
            listaRegistros.innerHTML = '<p>Nenhum acompanhamento encontrado com os filtros atuais.</p>';
            return;
        }
        const registrosOrdenados = registrosParaRenderizar.sort((a, b) => new Date(b.supervisaoData) - new Date(a.supervisaoData));
        registrosOrdenados.forEach(registro => {
            const div = document.createElement('div');
            div.className = 'registro-item';
            div.dataset.id = registro.id;
            div.innerHTML = `
                <span><strong>Paciente:</strong> ${registro.pacienteIniciais || 'N/A'}</span>
                <span><strong>Psicólogo(a):</strong> ${registro.psicologoNome || 'N/A'}</span>
                <span><strong>Data:</strong> ${registro.supervisaoData ? new Date(registro.supervisaoData + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</span>`;
            listaRegistros.appendChild(div);
        });
    }

    function aplicarFiltros() {
        const pacienteTermo = filtroPacienteInput.value.toLowerCase();
        const psicologoUidSelecionado = isSupervisor ? filtroPsicologoSelect.value : '';
        let registrosFiltrados = todosOsRegistros.filter(reg => {
            const pacienteMatch = !pacienteTermo || (reg.pacienteIniciais && reg.pacienteIniciais.toLowerCase().includes(pacienteTermo));
            const psicologoMatch = !isSupervisor || !psicologoUidSelecionado || reg.psicologoUid === psicologoUidSelecionado;
            return pacienteMatch && psicologoMatch;
        });
        renderizarLista(registrosFiltrados);
    }
    
    async function carregarRegistros() {
        listaRegistros.innerHTML = '<p>Carregando...</p>';
        try {
            const comoPsicologoQuery = supervisaoCollection.where('psicologoUid', '==', currentUser.uid);
            const comoSupervisorQuery = supervisaoCollection.where('supervisorUid', '==', currentUser.uid);
            const [psicologoSnapshot, supervisorSnapshot] = await Promise.all([ comoPsicologoQuery.get(), comoSupervisorQuery.get() ]);
            const registrosMap = new Map();
            psicologoSnapshot.forEach(doc => registrosMap.set(doc.id, { id: doc.id, ...doc.data() }));
            supervisorSnapshot.forEach(doc => registrosMap.set(doc.id, { id: doc.id, ...doc.data() }));
            todosOsRegistros = Array.from(registrosMap.values());
            if (isSupervisor) {
                const psicologosSupervisionados = new Map();
                todosOsRegistros.forEach(reg => {
                    if(reg.psicologoUid && reg.psicologoNome) {
                        psicologosSupervisionados.set(reg.psicologoUid, reg.psicologoNome);
                    }
                });
                filtroPsicologoSelect.innerHTML = '<option value="">Todos os Profissionais</option>';
                psicologosSupervisionados.forEach((nome, uid) => {
                    filtroPsicologoSelect.innerHTML += `<option value="${uid}">${nome}</option>`;
                });
            }
            aplicarFiltros();
        } catch (error) {
            console.error("Erro ao carregar registros:", error);
            listaRegistros.innerHTML = '<p style="color:red;">Ocorreu um erro ao buscar os dados.</p>';
        }
    }
    
    function preencherFormulario(dados) {
        form.reset();
        documentIdField.value = dados.id || '';
        for (const key in dados) {
            if (Object.prototype.hasOwnProperty.call(dados, key)) {
                const field = form.elements[key];
                if (field) {
                    if (field.tagName === 'SELECT') {
                        if (key === 'psicologoNome') field.value = dados.psicologoUid || '';
                        else if (key === 'supervisorNome') field.value = dados.supervisorUid || '';
                        else field.value = dados[key];
                    } else {
                        field.value = dados[key];
                    }
                }
            }
        }
        listaContainer.style.display = 'none';
        formContainer.style.display = 'block';
        deleteBtn.style.display = 'block';
        document.getElementById('paciente-iniciais').disabled = true;
    }

    const autoSaveForm = async () => {
        const pacienteIniciais = form.elements['pacienteIniciais'].value.trim();
        if (!pacienteIniciais) {
            if (saveStatus) saveStatus.textContent = 'Preencha as iniciais do paciente para salvar.';
            return;
        }
        if (saveStatus) saveStatus.textContent = 'Salvando...';
        const formData = new FormData(form);
        const dataToSave = Object.fromEntries(formData.entries());
        dataToSave.psicologoUid = psicologoSelect.value;
        dataToSave.supervisorUid = supervisorSelect.value;
        dataToSave.psicologoNome = psicologoSelect.options[psicologoSelect.selectedIndex]?.text || '';
        dataToSave.supervisorNome = supervisorSelect.options[supervisorSelect.selectedIndex]?.text || '';
        dataToSave.lastUpdated = new Date();
        try {
            const docId = documentIdField.value;
            if (docId) {
                await supervisaoCollection.doc(docId).set(dataToSave, { merge: true });
            } else {
                const newDocRef = await supervisaoCollection.add(dataToSave);
                documentIdField.value = newDocRef.id;
            }
            if (saveStatus) {
                saveStatus.textContent = 'Salvo ✓';
                setTimeout(() => { saveStatus.textContent = ''; }, 2500);
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            if (saveStatus) saveStatus.textContent = 'Erro ao salvar!';
        }
    };

    listaRegistros.addEventListener('click', async (e) => {
        const item = e.target.closest('.registro-item');
        if (item) {
            const docId = item.dataset.id;
            try {
                const docSnap = await supervisaoCollection.doc(docId).get();
                if (docSnap.exists()) {
                    await popularSelects();
                    preencherFormulario({ id: docId, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Erro ao abrir registro:", error);
                alert("Não foi possível carregar os detalhes deste registro.");
            }
        }
    });

    form.addEventListener('input', debounce(autoSaveForm, 2000));
    form.addEventListener('change', debounce(autoSaveForm, 2000));

    deleteBtn.addEventListener('click', async () => {
        const docId = documentIdField.value;
        if (docId && confirm("Tem certeza que deseja excluir este acompanhamento? Esta ação não pode ser desfeita.")) {
            try {
                await supervisaoCollection.doc(docId).delete();
                alert("Registro excluído com sucesso.");
                showSupervisaoDashboard();
            } catch (error) {
                alert("Erro ao excluir o registro.");
                console.error("Erro ao excluir:", error);
            }
        }
    });
    
    async function init() {
        const userDoc = await db.collection("usuarios").doc(currentUser.uid).get();
        if (userDoc.exists && userDoc.data().funcoes?.includes('supervisor')) {
            isSupervisor = true;
            filtroSupervisorView.style.display = 'block';
        }
        filtrosContainer.style.display = 'flex';
        if (window.formSupervisaoMode === 'new') {
            listaContainer.style.display = 'none';
            formContainer.style.display = 'block';
            deleteBtn.style.display = 'none';
            document.getElementById('paciente-iniciais').disabled = false;
            form.reset();
            documentIdField.value = '';
            popularSelects();
        } else {
            listaContainer.style.display = 'block';
            formContainer.style.display = 'none';
            carregarRegistros();
        }
        filtroPacienteInput.addEventListener('input', aplicarFiltros);
        filtroPsicologoSelect.addEventListener('change', aplicarFiltros);
    }

    init();
})();
