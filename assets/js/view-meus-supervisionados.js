(function() {
    if (!db || !auth.currentUser) return;
    const currentUser = auth.currentUser;
    const listaContainer = document.getElementById('lista-supervisionados-container');
    
    async function carregarSupervisionados() {
        try {
            const supervisaoQuery = db.collection('supervisao').where('supervisorUid', '==', currentUser.uid).orderBy('supervisaoData', 'desc');
            const snapshot = await supervisaoQuery.get();
            
            let listaHTML = '';
            if (snapshot.empty) {
                listaHTML = '<p>Nenhum acompanhamento encontrado para sua supervisão.</p>';
            } else {
                snapshot.forEach(doc => {
                    const registro = { id: doc.id, ...doc.data() };
                    listaHTML += `<div class="registro-item" data-id="${registro.id}">...</div>`; // Conteúdo completo abaixo
                });
            }
            listaContainer.innerHTML = listaHTML;
        } catch (error) {
            console.error("Erro ao carregar supervisionados:", error);
            listaContainer.innerHTML = '<p style="color:red;">Erro ao carregar a lista.</p>';
        }
    }

    listaContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.registro-item');
        if (item) {
            const docId = item.dataset.id;
            // A função loadFormularioView está no script principal do painel (supervisores.js)
            if(window.loadFormularioView) {
                window.loadFormularioView(docId);
            }
        }
    });

    carregarSupervisionados();
})();
