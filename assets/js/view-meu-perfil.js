// assets/js/view-meu-perfil.js (Versão 1 - Lógica de Visualização)
(function() {
    if (!window.firebase || !auth || !db) {
        console.error("Firebase não inicializado.");
        document.getElementById('supervisor-grid-container').innerHTML = '<p style="color:red;">Erro de inicialização. Verifique o console.</p>';
        return;
    }

    const currentUser = auth.currentUser;
    const gridContainer = document.getElementById('supervisor-grid-container');

    async function loadProfiles() {
        if (!currentUser || !gridContainer) return;
        
        try {
            const userDoc = await db.collection('usuarios').doc(currentUser.uid).get();
            if (!userDoc.exists) throw new Error("Usuário logado não encontrado.");
            
            const userData = userDoc.data();
            const isAdmin = userData.funcoes && userData.funcoes.includes('admin');

            let query;
            if (isAdmin) {
                // Se for admin, busca todos os usuários que são supervisores e não estão inativos.
                query = db.collection('usuarios')
                    .where('funcoes', 'array-contains', 'supervisor')
                    .where('inativo', '==', false)
                    .orderBy('nome');
            } else {
                // Se for apenas supervisor, busca somente o próprio perfil.
                query = db.collection('usuarios').where(firebase.firestore.FieldPath.documentId(), '==', currentUser.uid);
            }

            const snapshot = await query.get();

            if (snapshot.empty) {
                gridContainer.innerHTML = '<p>Nenhum perfil de supervisor foi encontrado.</p>';
                return;
            }

            gridContainer.innerHTML = ''; // Limpa o "Carregando..."
            snapshot.forEach(doc => {
                const supervisor = { uid: doc.id, ...doc.data() };
                const cardElement = createSupervisorCard(supervisor);
                gridContainer.appendChild(cardElement);
            });

        } catch (error) {
            console.error("Erro ao carregar perfis:", error);
            gridContainer.innerHTML = '<p style="color:red;">Ocorreu um erro ao carregar os perfis.</p>';
        }
    }

    function createSupervisorCard(supervisor) {
        const card = document.createElement('div');
        card.className = 'supervisor-card';

        const toList = (data) => {
            if (!data) return '<li>Não informado</li>';
            return Array.isArray(data) ? data.map(item => `<li>${item}</li>`).join('') : `<li>${data}</li>`;
        };

        // Lógica para encontrar a foto: usa o campo 'foto' se existir, senão, o primeiro nome.
        const photoName = supervisor.foto || `${supervisor.nome.toLowerCase().split(' ')[0]}.png`;
        const photoUrl = `../assets/img/supervisores/${photoName}`;

        card.innerHTML = `
            <div class="supervisor-card-left">
                <h2>${supervisor.nome || 'Nome Indisponível'}</h2>
                <h3>${supervisor.abordagem || 'Abordagem não informada'}</h3>
                <ul class="contact-info">
                    <li><strong>CRP:</strong> ${supervisor.crp || 'N/A'}</li>
                    <li><strong>Telefone:</strong> ${supervisor.telefone || 'N/A'}</li>
                    <li><strong>Email:</strong> ${supervisor.email || 'N/A'}</li>
                </ul>
                <div class="photo-container">
                    <img src="${photoUrl}" alt="Foto de ${supervisor.nome}" class="supervisor-photo" onerror="this.onerror=null;this.src='../assets/img/default-user.png';">
                    <img src="../assets/img/logo-eupsico.png" alt="Logo EuPsico" class="overlay-logo">
                </div>
            </div>
            <div class="supervisor-card-right">
                <button class="edit-supervisor-btn" data-uid="${supervisor.uid}">Editar</button>
                <div class="profile-header">PERFIL PROFISSIONAL</div>
                <h4>Formação</h4>
                <ul>${toList(supervisor.formacao)}</ul>
                <h4>Especialização</h4>
                <ul>${toList(supervisor.especializacao)}</ul>
                <h4>Áreas de Atuação</h4>
                <ul>${toList(supervisor.atuacao)}</ul>
                <h4>Informações de Supervisão</h4>
                <ul>${toList(supervisor.supervisaoInfo)}</ul>
                <h4>Dias e Horários</h4>
                <ul>${toList(supervisor.diasHorarios)}</ul>
            </div>
        `;
        return card;
    }

    loadProfiles();
})();
