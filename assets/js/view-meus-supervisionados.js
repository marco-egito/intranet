// assets/js/view-meus-supervisionados.js (Versão 2 - Corrigido)
(function() {
    if (!db || !auth.currentUser) return;
    const currentUser = auth.currentUser;
    const listaContainer = document.getElementById('lista-supervisionados-container');

    async function carregarSupervisionados() {
        if (!listaContainer) return;
        listaContainer.innerHTML = '<div class="loading-spinner"></div>'; // Mostra que está carregando

        try {
            // A consulta requer um índice no Firestore: (supervisorUid ASC, supervisaoData DESC)
            const supervisaoQuery = db.collection('supervisao')
                .where('supervisorUid', '==', currentUser.uid)
                .orderBy('supervisaoData', 'desc');
                
            const snapshot = await supervisaoQuery.get();

            if (snapshot.empty) {
                listaContainer.innerHTML = '<p>Nenhum acompanhamento encontrado onde você é o(a) supervisor(a).</p>';
                return;
            } 
            
            let listaHTML = '';
            snapshot.forEach(doc => {
                const registro = { id: doc.id, ...doc.data() };
                const dataFormatada = registro.supervisaoData ? new Date(registro.supervisaoData + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data não informada';
                
                // Adicionando um estilo básico para os itens da lista
                listaHTML += `
                    <div class="registro-item" data-id="${registro.id}" style="display: flex; justify-content: space-between; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px; cursor: pointer;">
                        <span><strong>Paciente:</strong> ${registro.pacienteIniciais || 'N/A'}</span>
                        <span><strong>Profissional Supervisionado:</strong> ${registro.psicologoNome || 'N/A'}</span>
                        <span><strong>Data da Supervisão:</strong> ${dataFormatada}</span>
                    </div>
                `;
            });
            listaContainer.innerHTML = listaHTML;

        } catch (error) {
            console.error("Erro ao carregar supervisionados:", error);
            // Mensagem de erro importante para o usuário!
            listaContainer.innerHTML = `
                <p style="color:red;">Ocorreu um erro ao carregar a lista.</p>
                <p><strong>Ação necessária:</strong> Verifique o console do navegador (tecla F12). Se houver um erro sobre "index", clique no link que o Firebase fornece para criar o índice necessário no banco de dados.</p>
            `;
        }
    }

    // A função de clique para ver detalhes (ainda não implementada)
    listaContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.registro-item');
        if (item) {
            const docId = item.dataset.id;
            // Aqui você pode implementar a lógica para visualizar o formulário preenchido
            alert("Visualização do formulário ainda não implementada. ID do Documento: " + docId);
        }
    });

    carregarSupervisionados();
})();
