(function() {
    // Garante que o Firebase esteja pronto antes de qualquer operação
    const firebaseConfig = {
        apiKey: "AIzaSyDJqPJjDDIGo7uRewh3pw1SQZOpMgQJs5M",
        authDomain: "eupsico-agendamentos-d2048.firebaseapp.com",
        databaseURL: "https://eupsico-agendamentos-d2048-default-rtdb.firebaseio.com",
        projectId: "eupsico-agendamentos-d2048",
        storageBucket: "eupsico-agendamentos-d2048.firebasestorage.app",
        messagingSenderId: "1041518416343",
        appId: "1:1041518416343:web:0a11c03c205b802ed7bb92"
    };
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    const modal = document.getElementById('agendamento-modal');
    if (!modal) return;

    const titleEl = document.getElementById('agendamento-modal-title');
    const supervisorNameEl = document.getElementById('agendamento-supervisor-nome');
    const datasContainer = document.getElementById('datas-disponiveis-container');
    const nomeProfissionalInput = document.getElementById('agendamento-profissional-nome');
    const contatoProfissionalInput = document.getElementById('agendamento-profissional-contato');
    const confirmBtn = document.getElementById('agendamento-confirm-btn');
    const step1 = document.getElementById('agendamento-step-1');
    const step2 = document.getElementById('agendamento-step-2');

    let currentSupervisorData = null;

    function getNextDates(diaDaSemana, quantidade) {
        const weekMap = { "domingo": 0, "segunda-feira": 1, "terça-feira": 2, "quarta-feira": 3, "quinta-feira": 4, "sexta-feira": 5, "sábado": 6 };
        const targetDay = weekMap[diaDaSemana.toLowerCase()];
        if (typeof targetDay === 'undefined') return [];
        let results = [];
        let date = new Date();
        date.setHours(0, 0, 0, 0);
        while (date.getDay() !== targetDay) {
            date.setDate(date.getDate() + 1);
        }
        for (let i = 0; i < quantidade; i++) {
            results.push(new Date(date));
            date.setDate(date.getDate() + 14);
        }
        return results;
    }

    function calculateCapacity(inicio, fim) {
        try {
            const [startH, startM] = inicio.split(':').map(Number);
            const [endH, endM] = fim.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;
            return Math.floor((endMinutes - startMinutes) / 30);
        } catch (e) { return 0; }
    }
    
    function renderDates(horariosDisponiveis) {
        datasContainer.innerHTML = '';
        const availableSlots = horariosDisponiveis.filter(slot => (slot.capacity - slot.booked) > 0);

        if (availableSlots.length === 0) {
            datasContainer.innerHTML = `<p style="text-align: center; font-weight: bold;">Não há vagas disponíveis no momento.</p><p style="text-align: center; font-size: 0.9em; margin-top: 10px;">Por favor, entre em contato com o supervisor para verificar a possibilidade de novas vagas.</p>`;
            confirmBtn.disabled = true;
            return;
        }

        availableSlots.forEach((slot, index) => {
            const date = slot.date;
            const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const horarioInfo = `${slot.horario.dia} - ${slot.horario.inicio}`;
            const vagasRestantes = slot.capacity - slot.booked;
            const radioId = `date-${index}`;
            const optionHtml = `<div class="date-option"> <input type="radio" id="${radioId}" name="data_agendamento" value="${date.toISOString()}"> <label for="${radioId}"> <strong>${formattedDate}</strong> (${horarioInfo}) <span>Vagas restantes: ${vagasRestantes}</span> </label> </div>`;
            datasContainer.innerHTML += optionHtml;
        });
        confirmBtn.disabled = false;
    }

    async function open(supervisorData) {
        currentSupervisorData = supervisorData;
        if (!currentSupervisorData) { alert("Erro: Dados do supervisor não foram fornecidos."); return; }

        titleEl.textContent = `Agendar Supervisão`;
        supervisorNameEl.textContent = currentSupervisorData.nome;
        step1.style.display = 'block';
        step2.style.display = 'none';
        confirmBtn.style.display = 'inline-block';
        confirmBtn.disabled = false;
        datasContainer.innerHTML = '<div class="loading-spinner"></div>';
        
        // --- INÍCIO DA MELHORIA: Pré-preenchimento dos dados do profissional ---
        nomeProfissionalInput.value = 'Carregando...';
        contatoProfissionalInput.value = 'Carregando...';
        const currentUser = auth.currentUser;
        if (currentUser) {
            try {
                const userDoc = await db.collection('usuarios').doc(currentUser.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    nomeProfissionalInput.value = userData.nome || '';
                    contatoProfissionalInput.value = userData.telefone || userData.email || '';
                }
            } catch (error) {
                console.error("Erro ao buscar dados do profissional logado:", error);
                nomeProfissionalInput.value = 'Erro ao carregar dados.';
                contatoProfissionalInput.value = '';
            }
        }
        // --- FIM DA MELHORIA ---
        
        modal.style.display = 'flex';

        try {
            let potentialSlots = [];
            if (currentSupervisorData.diasHorarios && Array.isArray(currentSupervisorData.diasHorarios)) {
                currentSupervisorData.diasHorarios.forEach(horario => {
                    if (horario && horario.dia && horario.inicio && horario.fim) {
                        const dates = getNextDates(horario.dia, 5);
                        dates.forEach(date => {
                            const [h, m] = horario.inicio.split(':');
                            date.setHours(h, m, 0, 0);
                            potentialSlots.push({ date, horario });
                        });
                    }
                });
            }
            
            const agendamentosRef = db.collection('agendamentos');
            const slotChecks = potentialSlots.map(async slot => {
                const querySnapshot = await agendamentosRef
                    .where('supervisorUid', '==', currentSupervisorData.uid)
                    .where('dataAgendamento', '==', slot.date.toISOString())
                    .get();
                
                slot.booked = querySnapshot.size;
                slot.capacity = calculateCapacity(slot.horario.inicio, slot.horario.fim);
                return slot;
            });

            const finalSlots = await Promise.all(slotChecks);
            renderDates(finalSlots);
        } catch (error) {
            console.error("Erro ao calcular datas disponíveis:", error);
            datasContainer.innerHTML = `<p style="color: red;">Ocorreu um erro ao buscar os horários. Tente novamente mais tarde.</p>`;
            confirmBtn.disabled = true;
        }
    }
    
    async function handleConfirmAgendamento() {
        const nome = nomeProfissionalInput.value.trim();
        const contato = contatoProfissionalInput.value.trim();
        const selectedRadio = datasContainer.querySelector('input[name="data_agendamento"]:checked');

        if (!selectedRadio) { alert("Por favor, selecione uma data."); return; }
        if (!nome || !contato) { alert("Seus dados de nome e contato não foram encontrados. Não é possível agendar."); return; }

        const dataAgendamento = selectedRadio.value;
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Aguarde...';

        try {
            await db.runTransaction(async (transaction) => {
                const agendamentosRef = db.collection('agendamentos');
                const query = agendamentosRef.where('supervisorUid', '==', currentSupervisorData.uid).where('dataAgendamento', '==', dataAgendamento);
                const snapshot = await transaction.get(query);
                
                const horarioInfo = currentSupervisorData.diasHorarios.find(h => 
                    h.inicio === new Date(dataAgendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'})
                );

                if (!horarioInfo) throw new Error("Horário base não pôde ser verificado.");
                const capacity = calculateCapacity(horarioInfo.inicio, horarioInfo.fim);
                if (snapshot.size >= capacity) {
                    throw new Error("Desculpe, todas as vagas para este horário foram preenchidas.");
                }

                const newDocRef = agendamentosRef.doc();
                transaction.set(newDocRef, {
                    supervisorUid: currentSupervisorData.uid, supervisorNome: currentSupervisorData.nome,
                    dataAgendamento: dataAgendamento, profissionalNome: nome,
                    profissionalContato: contato, 
                    // --- CORREÇÃO DO ERRO ---
                    // Salvando a data como um texto padrão (string) para evitar o erro de tipo.
                    criadoEm: new Date().toISOString()
                });
            });
            step1.style.display = 'none';
            confirmBtn.style.display = 'none';
            step2.style.display = 'block';
        } catch (error) {
            console.error("Erro ao agendar:", error);
            alert("Não foi possível realizar o agendamento. " + error.message);
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirmar Agendamento';
        }
    }
    
    if (modal) {
        modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.style.display = 'none');
        modal.querySelector('#agendamento-cancel-btn').addEventListener('click', () => modal.style.display = 'none');
        confirmBtn.addEventListener('click', handleConfirmAgendamento);
    }
    
    window.agendamentoController = {
        open: open
    };
})();