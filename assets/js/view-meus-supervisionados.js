// assets/js/view-meus-supervisionados.js (Versão Final)
(function() {
    if (!db || !auth.currentUser) return;
    const currentUser = auth.currentUser;
    const listaContainer = document.getElementById('lista-supervisionados-container');

    async function carregarSupervisionados() {
        if (!listaContainer) return;
        listaContainer.innerHTML = '<div class="loading-spinner"></div>'; 

        try {
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
                
                listaHTML += `
                    <div class="registro-item" data-id="${registro.id}" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; text-align: left; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px; cursor: pointer;">
                        <div><strong>Paciente:</strong><br>${registro.pacienteIniciais || 'N/A'}</div>
                        <div><strong>Profissional Supervisionado:</strong><br>${registro.psicologoNome || 'N/A'}</div>
                        <div><strong>Data da Supervisão:</strong><br>${dataFormatada}</div>
                    </div>
                `;
            });
            listaContainer.innerHTML = listaHTML;

        } catch (error) {
            console.error("Erro ao carregar supervisionados:", error);
            listaContainer.innerHTML = `
                <p style="color:red;">Ocorreu um erro ao carregar a lista.</p>
                <p>Verifique o console do navegador (F12) para mais detalhes.</p>
            `;
        }
    }
    
    // --- ALTERAÇÃO FINAL AQUI ---
    // Adiciona o listener para chamar a função global
    listaContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.registro-item');
        if (item) {
            const docId = item.dataset.id;
            // Em vez de 'alert', chama a função que carrega a view do formulário
            if (window.loadFormularioView) {
                window.loadFormularioView(docId);
            } else {
                console.error("A função loadFormularioView não foi encontrada.");
            }
        }
    });

    carregarSupervisionados();
})();
