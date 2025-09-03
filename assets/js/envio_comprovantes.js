(function() {
    if (!db) {
        console.error("Instância do Firestore (db) não encontrada.");
        return;
    }

    // ***** MANTENHA A URL DO SEU APP SCRIPT AQUI *****
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzOGyDANVS--DeH6T-ZaqFiEmhpBYUJu4P8VT0uevQPwC3tLL5EgappHPI2mhKwPtf1fg/exec";

    let formData = {};
    let form, selectProfissional, selectMes, statusDiv, formContainer, confirmationSection, finalMessageSection, messageContainer;

    async function init() {
        form = document.getElementById('comprovante-form');
        selectProfissional = document.getElementById('form-profissional');
        selectMes = document.getElementById('form-mes-ref');
        statusDiv = document.getElementById('upload-status');
        formContainer = document.getElementById('form-container');
        confirmationSection = document.getElementById('confirmation-section');
        finalMessageSection = document.getElementById('final-message-section');
        messageContainer = document.getElementById('message-container');

        if (!form) return;

        attachEventListeners();
        popularProfissionais();
        popularMeses();
    }

    async function popularProfissionais() {
        console.log("--- INICIANDO BUSCA DE PROFISSIONAIS (MODO DEBUG) ---");
        try {
            // 1. Buscando TODOS os usuários para depuração, apenas ordenados por nome
            console.log("1. Buscando todos os usuários na coleção 'usuarios'...");
            const snapshot = await db.collection('usuarios').orderBy('nome').get();
            
            if (snapshot.empty) {
                console.error("ERRO GRAVE: Nenhum documento encontrado na coleção 'usuarios'. Verifique se a coleção existe e se as regras de segurança permitem a leitura.");
                selectProfissional.innerHTML = '<option value="">Nenhum usuário encontrado no DB</option>';
                return;
            }

            const todosProfissionais = snapshot.docs.map(doc => doc.data());
            console.log(`2. Encontrado um total de ${todosProfissionais.length} profissionais no banco de dados.`);
            console.log("Dados brutos encontrados:", todosProfissionais);

            // 3. Filtrando no código para encontrar os qualificados
            console.log("3. Filtrando profissionais que atendem aos critérios: inativo === false E recebeDireto === true");
            
            const profissionaisQualificados = todosProfissionais.filter(p => {
                const isAtivo = p.inativo === false;
                const isRecebeDireto = p.recebeDireto === true;
                // Log detalhado para cada profissional
                console.log(`- Verificando "${p.nome}": inativo=${p.inativo} (é ativo: ${isAtivo}), recebeDireto=${p.recebeDireto} (qualificado: ${isRecebeDireto}). Resultado final: ${isAtivo && isRecebeDireto}`);
                return isAtivo && isRecebeDireto;
            });

            console.log(`4. Total de profissionais qualificados após o filtro: ${profissionaisQualificados.length}`);
            
            if (profissionaisQualificados.length === 0) {
                selectProfissional.innerHTML = '<option value="">Nenhum profissional qualificado encontrado</option>';
                console.log("5. Nenhum profissional passou nos filtros. A lista ficará vazia.");
                return;
            }
            
            const optionsHtml = ['<option value="">Selecione um profissional...</option>', ...profissionaisQualificados.map(p => `<option value="${p.nome}">${p.nome}</option>`)].join('');
            selectProfissional.innerHTML = optionsHtml;
            console.log("5. Lista de profissionais preenchida com sucesso na tela!");

        } catch (error) {
            console.error("ERRO CRÍTICO AO BUSCAR PROFISSIONAIS:", error);
            selectProfissional.innerHTML = '<option value="">Erro ao carregar (ver console)</option>';
        }
    }
    

    function popularMeses() {
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const mesOptions = meses.map(m => `<option value="${m}">${m}</option>`).join('');
        selectMes.innerHTML = mesOptions;
        
        const today = new Date();
        selectMes.value = meses[today.getMonth()];
        document.getElementById('form-data-pagamento').value = today.toISOString().split('T')[0];
    }
    
    function showMessage(message, type = 'error') {
        if (!messageContainer) return;
        messageContainer.textContent = message;
        messageContainer.className = type === 'error' ? 'message-error' : 'message-info';
        messageContainer.style.display = 'block';
    }

    function hideMessage() {
        if (messageContainer) {
            messageContainer.style.display = 'none';
        }
    }
    
    function validateForm() {
        const fields = {
            profissional: { value: document.getElementById('form-profissional').value, name: 'Seu Nome' },
            paciente: { value: document.getElementById('form-paciente').value.trim(), name: 'Nome do Paciente' },
            dataPagamento: { value: document.getElementById('form-data-pagamento').value, name: 'Data do Pagamento' },
            valor: { value: document.getElementById('form-valor').value, name: 'Valor da Contribuição' },
            file: { value: document.getElementById('form-arquivo').files.length, name: 'Anexo do Comprovante' }
        };
        for (const key in fields) {
            if (!fields[key].value) {
                showMessage(`O campo '${fields[key].name}' é obrigatório.`);
                return false;
            }
        }
        if (isNaN(parseFloat(fields.valor.value))) {
            showMessage(`O valor informado no campo '${fields.valor.name}' não é válido.`);
            return false;
        }
        hideMessage();
        return true;
    }

    function attachEventListeners() {
        document.getElementById('btn-review').addEventListener('click', () => {
            if (!validateForm()) return;
            const profissional = document.getElementById('form-profissional').value;
            const paciente = document.getElementById('form-paciente').value;
            const dataPagamento = new Date(document.getElementById('form-data-pagamento').value + 'T00:00:00').toLocaleDateString('pt-BR');
            const mesReferencia = document.getElementById('form-mes-ref').value;
            const valor = parseFloat(document.getElementById('form-valor').value);
            const file = document.getElementById('form-arquivo').files[0];
            formData = { profissional, paciente, dataPagamentoOriginal: document.getElementById('form-data-pagamento').value, mesReferencia, valor, file };
            document.getElementById('confirm-profissional').textContent = profissional;
            document.getElementById('confirm-paciente').textContent = paciente;
            document.getElementById('confirm-data').textContent = dataPagamento;
            document.getElementById('confirm-mes').textContent = mesReferencia;
            document.getElementById('confirm-valor').textContent = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            document.getElementById('confirm-arquivo').textContent = file.name;
            formContainer.style.display = 'none';
            confirmationSection.style.display = 'block';
        });

        document.getElementById('btn-edit').addEventListener('click', () => {
            formContainer.style.display = 'block';
            confirmationSection.style.display = 'none';
        });
        
        document.getElementById('btn-confirm-send').addEventListener('click', () => {
            const saveBtn = document.getElementById('btn-confirm-send');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Enviando...';
            const reader = new FileReader();
            reader.readAsDataURL(formData.file);
            reader.onload = function() {
                const fileData = reader.result.split(',')[1];
                const payload = {
                    profissional: formData.profissional, paciente: formData.paciente,
                    dataPagamento: formData.dataPagamentoOriginal, mesReferencia: formData.mesReferencia,
                    valor: formData.valor, fileName: formData.file.name,
                    mimeType: formData.file.type, fileData: fileData
                };
                
                fetch(WEB_APP_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(response => {
                    if (response.status === 'success') {
                        const comprovanteData = {
                            profissional: payload.profissional, paciente: payload.paciente,
                            valor: payload.valor, dataPagamento: payload.dataPagamento,
                            mesReferencia: payload.mesReferencia, anoReferencia: new Date(payload.dataPagamento).getFullYear(),
                            comprovanteUrl: response.fileUrl, status: 'Pendente',
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        };
                        return db.collection('comprovantes').add(comprovanteData).then(() => payload);
                    } else {
                        throw new Error(response.message);
                    }
                })
                .then(payload => {
                    confirmationSection.style.display = 'none';
                    const summaryHtml = `
                        <p><strong>Profissional:</strong> <span>${payload.profissional}</span></p>
                        <p><strong>Paciente:</strong> <span>${payload.paciente}</span></p>
                        <p><strong>Data:</strong> <span>${new Date(payload.dataPagamento + 'T00:00:00').toLocaleDateString('pt-BR')}</span></p>
                        <p><strong>Valor:</strong> <span>${payload.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>`;
                    document.getElementById('sent-data-summary').innerHTML = summaryHtml;
                    finalMessageSection.style.display = 'block';
                    form.reset();
                })
                .catch(error => {
                    console.error('Erro:', error);
                    showMessage('Ocorreu um erro grave no envio: ' + error.message, 'error');
                    formContainer.style.display = 'block';
                    confirmationSection.style.display = 'none';
                })
                .finally(() => {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Confirmar e Enviar';
                });
            };
        });

        document.getElementById('btn-new-form').addEventListener('click', () => {
            finalMessageSection.style.display = 'none';
            formContainer.style.display = 'block';
            hideMessage();
        });
    }

    // Inicia a aplicação
    init();
})();
