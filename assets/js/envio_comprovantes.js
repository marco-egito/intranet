// assets/js/envio_comprovantes.js
(function() {
    if (!db) { return; }

    const form = document.getElementById('comprovante-form');
    const selectProfissional = document.getElementById('comp-profissional');
    const selectMes = document.getElementById('comp-mes-ref');
    const statusDiv = document.getElementById('upload-status');
    
    // ***** COLOQUE A URL DO SEU APP SCRIPT AQUI *****
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyKhLY6TCgRSE_630R8G8tIYhHriJxxo_cJJjcbuoDwypSvtxu7L7Y6X2AJmJE2QxVb8g/exec";

    // Preenche a lista de profissionais
    async function popularProfissionais() {
        try {
            const snapshot = await db.collection('usuarios').where('inativo', '==', false).orderBy('nome').get();
            selectProfissional.innerHTML = '<option value="" disabled selected>Selecione um profissional</option>';
            snapshot.forEach(doc => {
                const user = doc.data();
                const option = document.createElement('option');
                option.value = user.nome;
                option.textContent = user.nome;
                selectProfissional.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao buscar profissionais:", error);
            selectProfissional.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    // Preenche a lista de meses
    function popularMeses() {
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const mesAtual = new Date().getMonth();
        meses.forEach((mes, index) => {
            const option = document.createElement('option');
            option.value = mes;
            option.textContent = mes;
            if (index === mesAtual) {
                option.selected = true;
            }
            selectMes.appendChild(option);
        });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const file = document.getElementById('comp-file').files[0];
        if (!file) {
            window.showToast('Por favor, anexe um arquivo.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async function(event) {
            const fileData = event.target.result.split(',')[1]; // Pega apenas os dados base64
            
            const formData = {
                profissional: document.getElementById('comp-profissional').value,
                paciente: document.getElementById('comp-paciente').value,
                valor: parseFloat(document.getElementById('comp-valor').value),
                dataPagamento: document.getElementById('comp-data-pgto').value,
                mesReferencia: document.getElementById('comp-mes-ref').value,
                fileName: file.name,
                mimeType: file.type,
                fileData: fileData
            };
            
            statusDiv.className = 'loading';
            form.querySelector('button').disabled = true;

            try {
                // 1. Envia para o Google Apps Script
                const responseScript = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(formData),
                    headers: { 'Content-Type': 'application/json' }
                });
                const resultScript = await responseScript.json();

                if (resultScript.status !== 'success') {
                    throw new Error(resultScript.message);
                }
                
                // 2. Se o passo 1 deu certo, salva no Firestore
                const comprovanteData = {
                    profissional: formData.profissional,
                    paciente: formData.paciente,
                    valor: formData.valor,
                    dataPagamento: formData.dataPagamento,
                    mesReferencia: formData.mesReferencia,
                    anoReferencia: new Date(formData.dataPagamento).getFullYear(),
                    comprovanteUrl: resultScript.fileUrl, // URL retornada pelo script
                    status: 'Pendente',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                await db.collection('comprovantes').add(comprovanteData);

                window.showToast('Comprovante enviado com sucesso!', 'success');
                form.reset();
                popularMeses(); // Reseta o mês para o atual

            } catch (error) {
                console.error("Erro no processo de envio:", error);
                window.showToast(`Erro: ${error.message}`, 'error');
            } finally {
                statusDiv.className = '';
                form.querySelector('button').disabled = false;
            }
        };
        reader.readAsDataURL(file); // Inicia a leitura do arquivo
    });

    // Inicializa a página
    popularProfissionais();
    popularMeses();
})();
