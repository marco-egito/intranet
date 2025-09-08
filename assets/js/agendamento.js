(function() {
    if (!window.firebase) {
        console.error("Firebase não inicializado.");
        return;
    }
    const db = firebase.firestore();

    const modal = document.getElementById('agendamento-modal');
    if (!modal) return; // Se o modal não existe, o script não precisa rodar

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
        } catch (e) {
            console.error("Erro ao calcular capacidade para o horário:", {inicio, fim});
            return 0;
        }
    }
    
    function renderDates(horariosDisponiveis) {
        datasContainer.innerHTML = '';
        
        const availableSlots = horariosDisponiveis.filter(slot => (slot.capacity - slot.booked) > 0);

        // --- MUDANÇA: Mensagem melhorada quando não há vagas ---
        if (availableSlots.length === 0) {
            datasContainer.innerHTML = `
                <p style="text-align: center; font-weight: bold;">
                    Não há vagas disponíveis no momento.
                </p>
                <p style="text-align: center; font-size: 0.9em; margin-top: 10px;">
                    Por favor, entre em contato com o supervisor para verificar a possibilidade de novas vagas.
                </p>`;
            confirmBtn.disabled = true;
            return;
        }

        availableSlots.forEach((slot, index) => {
            const date = slot.date;
            const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const horarioInfo = `${slot.horario.dia} - ${slot.horario.inicio}`;
            const vagasRestantes = slot.capacity - slot.booked;
            const radioId = `date-${index}`;

            const optionHtml = `
                <div class="date-option">
                    <input type="radio" id="${radioId}" name="data_agendamento" value="${date.toISOString()}">
                    <label for="${radioId}">
                        <strong>${formattedDate}</strong> (${horarioInfo})
                        <span>Vagas restantes: ${vagasRestantes}</span>
                    </label>
                </div>`;
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
        nomeProfissionalInput.value = '';
        contatoProfissionalInput.value = '';
        datasContainer.innerHTML = '<div class="loading-spinner"></div>'; // Spinner em vez de texto
        modal.style.display = 'flex';

        // --- MUDANÇA: Adicionado Try/Catch para tratamento de erros ---
        try {
            let potentialSlots = [];
            if (currentSupervisorData.diasHorarios && Array.isArray(currentSupervisorData.diasHorarios)) {
                currentSupervisorData.diasHorarios.forEach(horario => {
                    const dates = getNextDates(horario.dia, 5);
                    dates.forEach(date => {
                        const [h, m] = horario.inicio.split(':');
                        date.setHours(h, m, 0, 0);
                        potentialSlots.push({ date, horario });
                    });
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
        // ... (Esta função continua a mesma da versão anterior)
        const nome = nomeProfissionalInput.value.trim();
        const contato = contatoProfissionalInput.value.trim();
        const selectedRadio = datasContainer.querySelector('input[name="data_agendamento"]:checked');

        if (!selectedRadio) { alert("Por favor, selecione uma data para o agendamento."); return; }
        if (!nome || !contato) { alert("Por favor, preencha seu nome e contato."); return; }

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
                    throw new Error("Desculpe, todas as vagas para este horário foram preenchidas enquanto você decidia.");
                }

                const newDocRef = agendamentosRef.doc();
                transaction.set(newDocRef, {
                    supervisorUid: currentSupervisorData.uid, supervisorNome: currentSupervisorData.nome,
                    dataAgendamento: dataAgendamento, profissionalNome: nome,
                    profissionalContato: contato, criadoEm: firebase.firestore.FieldValue.serverTimestamp()
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
        cancelBtn.addEventListener('click', () => modal.style.display = 'none');
        confirmBtn.addEventListener('click', handleConfirmAgendamento);
    }
    
    window.agendamentoController = {
        open: open
    };
})();