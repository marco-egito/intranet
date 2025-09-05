// assets/js/supervisores.js
const firebaseConfig = {
  apiKey: "AIzaSyDJqPJjDDIGo7uRewh3pw1SQZOpMgQJs5M",
  authDomain: "eupsico-agendamentos-d2048.firebaseapp.com",
  databaseURL: "https://eupsico-agendamentos-d2048-default-rtdb.firebaseio.com",
  projectId: "eupsico-agendamentos-d2048",
  storageBucket: "eupsico-agendamentos-d2048.firebasestorage.app",
  messagingSenderId: "1041518416343",
  appId: "1:1041518416343:web:0a11c03c205b802ed7bb92"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

(function() {
    const container = document.getElementById('supervisor-grid-container');

    async function carregarSupervisores() {
        if (!container) return;

        try {
            const query = db.collection('usuarios')
                .where('funcoes', 'array-contains', 'supervisor')
                .where('inativo', '!=', true)
                .orderBy('nome');
                
            const snapshot = await query.get();
            container.innerHTML = ''; // Limpa o spinner de carregamento

            if (snapshot.empty) {
                container.innerHTML = '<p>Nenhum supervisor encontrado.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const prof = doc.data();
                const cardHTML = criarCardSupervisor(prof);
                container.innerHTML += cardHTML;
            });

        } catch (error) {
            console.error("Erro ao carregar supervisores:", error);
            container.innerHTML = '<p style="color:red;">Erro ao carregar a lista de supervisores.</p>';
        }
    }

    function criarCardSupervisor(prof) {
        // Gera o HTML para cada seção, apenas se os dados existirem no Firestore
        const especializacaoHTML = (prof.especializacao || []).map(item => `<li>${item}</li>`).join('');
        const atuacaoHTML = (prof.atuacao || []).map(item => `<li>${item}</li>`).join('');
        const supervisaoHTML = (prof.supervisaoInfo || []).map(item => `<li>${item}</li>`).join('');
        const horariosHTML = (prof.diasHorarios || []).map(item => `<li>${item}</li>`).join('');

        return `
            <div class="supervisor-card">
                <div class="supervisor-card-left">
                    <h2>${prof.nome || 'Nome não informado'}</h2>
                    <h3>SUPERVISORA</h3>
                    <ul class="contact-info">
                        <li>📧 ${prof.email || ''}</li>
                        <li>📞 ${prof.contato || ''}</li>
                        <li>🌐 www.eupsico.org.br</li>
                    </ul>
                    <div class="photo-container">
                        <img src="${prof.fotoUrl || '../assets/img/default-user.png'}" alt="Foto de ${prof.nome}" class="supervisor-photo">
                        <img src="../assets/img/logo-branca.png" alt="Logo EuPsico" class="overlay-logo">
                    </div>
                </div>
                <div class="supervisor-card-right">
                    <div class="profile-header">PERFIL</div>
                    
                    ${prof.formacao ? `<h4>Formação</h4><ul><li>${prof.formacao}</li></ul>` : ''}
                    ${especializacaoHTML ? `<h4>Especialização</h4><ul>${especializacaoHTML}</ul>` : ''}
                    ${atuacaoHTML ? `<h4>Atuação</h4><ul>${atuacaoHTML}</ul>` : ''}
                    ${supervisaoHTML ? `<h4>Supervisão</h4><ul>${supervisaoHTML}</ul>` : ''}
                    ${horariosHTML ? `<h4>Dias e Horários</h4><ul>${horariosHTML}</ul>` : ''}
                </div>
            </div>
        `;
    }

    carregarSupervisores();
})();
