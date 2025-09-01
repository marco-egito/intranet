// /assets/painel-script.js
document.addEventListener('DOMContentLoaded', function() {
    // --- CONFIGURAÇÃO DO FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyCLeWW39nqxsdv1YD-CNa9RSTv05lGHJxM",
        authDomain: "eupsico-agendamentos-d2048.firebaseapp.com",
        databaseURL: "https://eupsico-agendamentos-d2048-default-rtdb.firebaseio.com",
        projectId: "eupsico-agendamentos-d2048",
        storageBucket: "eupsico-agendamentos-d2048.appspot.com",
        messagingSenderId: "1041518416343",
        appId: "1:1041518416343:web:3b972c212c52a59ad7bb92"
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const rtdb = firebase.database();

    // --- ELEMENTOS DO DOM ---
    const contentArea = document.getElementById('content-area');
    const navButtons = document.querySelectorAll('.nav-button');
    const logoutButton = document.getElementById('logout-button');

    // --- CONTROLE DE AUTENTICAÇÃO ---
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            document.body.innerHTML = `<div style="text-align:center; padding-top: 50px;"><h2>Acesso Negado</h2><p>Você precisa estar logado. Você será redirecionado.</p></div>`;
            setTimeout(() => { window.location.href = './index.html'; }, 3000);
            return;
        }

        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        if (!userDoc.exists || !(userDoc.data().funcoes?.includes('admin') || userDoc.data().funcoes?.includes('financeiro'))) {
            document.body.innerHTML = `<div style="text-align:center; padding-top: 50px;"><h2>Acesso Negado</h2><p>Você não tem permissão para acessar esta área.</p></div>`;
            return;
        }
        
        loadView('view-dashboard'); // Carrega o dashboard inicial
    });

    // --- LÓGICA DE NAVEGAÇÃO ---
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            loadView(e.target.dataset.view);
        });
    });

    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            // Fecha a janela ou redireciona para a página principal
            // Idealmente, redirecionar para o index.html principal
            window.location.href = './index.html';
        });
    });

    function loadView(viewId) {
        contentArea.innerHTML = '<h2>Carregando...</h2>';
        switch (viewId) {
            case 'view-dashboard':
                renderDashboard();
                break;
            case 'view-profissionais':
                renderProfissionais();
                break;
            // Adicione um 'case' para cada botão do menu
            // Ex: case 'view-resumo-horas': renderResumoHoras(); break;
            default:
                contentArea.innerHTML = '<h2>Página não encontrada</h2>';
        }
    }
    
    // --- FUNÇÕES DE RENDERIZAÇÃO DE CADA MÓDULO ---

    function renderDashboard() {
        contentArea.innerHTML = `
            <div class="view-container">
                <h1>Dashboard Financeiro</h1>
                <p>Bem-vindo ao painel de controle financeiro. Utilize o menu à esquerda para navegar entre as ferramentas.</p>
                </div>
        `;
    }

    // ##### MÓDULO DE GESTÃO DE PROFISSIONAIS (COMPLETO) #####
    function renderProfissionais() {
        // 1. Injeta o HTML completo da ferramenta
        contentArea.innerHTML = `
            <div class="view-container">
                <h1>Configurações Gerais do Financeiro</h1>
                <div class="tab">
                    <button class="tablinks" data-tab="GestaoProfissionais" id="defaultOpen">Gestão de Profissionais</button>
                    </div>

                <div id="GestaoProfissionais" class="tabcontent">
                    <h2>Gestão de Profissionais</h2>
                    <p>Adicione ou edite os dados de um profissional. A conta de login deve ser criada no Console do Firebase.</p>
                    <div class="button-bar">
                        <button class="action-button add-row-btn" id="add-profissional-btn">Adicionar Profissional</button>
                    </div>
                    <table id="profissionais-table">
                        <thead>
                            <tr>
                                <th>Nome</th><th>Email</th><th>Funções</th><th>Inativo?</th><th>Ações</th>
                            </tr>
                        </thead>
                        <tbody><tr><td colspan="5">Carregando...</td></tr></tbody>
                    </table>
                </div>
            </div>
            
            <div id="user-modal" class="modal">
                <div class="modal-content">
                     </div>
            </div>
        `;

        // 2. Executa o JavaScript que dá vida à ferramenta
        
        // --- Variáveis e Referências ---
        const usuariosCollection = db.collection('usuarios');
        let localUsuariosList = [];

        // --- Funções Auxiliares (Toast, Modal, etc.) ---
        function showToast(message, type = 'success') { /* ...código do toast... */ }
        function openUserModal(user = null) { /* ...código do modal... */ }
        function closeUserModal() { document.getElementById('user-modal').style.display = 'none'; }
        
        // --- Função Principal de Carregamento de Dados ---
        function loadUsuarios() {
            const tableBody = document.querySelector('#profissionais-table tbody');
            usuariosCollection.orderBy('nome').onSnapshot(snapshot => {
                localUsuariosList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                tableBody.innerHTML = ''; // Limpa a tabela
                localUsuariosList.forEach(user => {
                    const row = tableBody.insertRow();
                    row.innerHTML = `
                        <td>${user.nome || ''}</td>
                        <td>${user.email || ''}</td>
                        <td>${(user.funcoes || []).join(', ')}</td>
                        <td>${user.inativo ? 'Sim' : 'Não'}</td>
                        <td>
                            <button class="action-button edit-row-btn" data-id="${user.id}">Editar</button>
                            <button class="action-button delete-row-btn" data-id="${user.id}">Excluir</button>
                        </td>
                    `;
                });
            }, error => {
                console.error("Erro ao carregar usuários: ", error);
                tableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar dados.</td></tr>';
            });
        }
        
        // --- Adicionar Event Listeners para os botões ---
        document.getElementById('add-profissional-btn').addEventListener('click', () => {
            // Lógica para abrir o modal de adição
            showToast('Funcionalidade de Adicionar a ser implementada.', 'info');
        });

        document.querySelector('#profissionais-table tbody').addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-row-btn')) {
                // Lógica para abrir modal de edição
                showToast('Funcionalidade de Editar a ser implementada.', 'info');
            }
            if (e.target.classList.contains('delete-row-btn')) {
                // Lógica para deletar
                const userId = e.target.dataset.id;
                if (confirm('Tem certeza que deseja excluir este usuário?')) {
                    usuariosCollection.doc(userId).delete()
                        .then(() => showToast('Usuário excluído!', 'success'))
                        .catch(err => showToast(`Erro: ${err.message}`, 'error'));
                }
            }
        });

        // --- Inicialização do Módulo ---
        loadUsuarios(); // Chama a função para carregar os dados
    }

    // Aqui você adicionaria as outras funções: renderResumoHoras(), renderCobranca(), etc.
});
