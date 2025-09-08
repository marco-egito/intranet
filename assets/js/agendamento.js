(function() {
    if (!window.firebase) {
        console.error("Firebase não inicializado.");
        return;
    }
    const db = firebase.firestore();

    // --- Elementos do DOM do Modal de Agendamento ---
    const modal = document.getElementById('agendamento-modal');
    const titleEl = document.getElementById('agendamento-modal-title');
    const supervisorNameEl = document.getElementById('agendamento-supervisor-nome');
    const datasContainer = document.getElementById('datas-disponiveis-container');
    const horarioBaseInfoEl = document.getElementById('horario-base-info');
    const nomeProfissionalInput = document.getElementById('agendamento-profissional-nome');
    const contatoProfissionalInput = document.getElementById('agendamento-profissional-contato');
    const confirmBtn = document.getElementById('agendamento-confirm-btn');
    const cancelBtn = document.getElementById('agendamento-cancel-btn');
    const step1 = document.getElementById('agendamento-step-1');
    const step2 = document.getElementById('agendamento-step-2');

    let currentSupervisor = null;

    // --- Funções de Lógica ---

    // Calcula as próximas N ocorrências de um dia da semana
    function getNextDates(diaDaSemana, quantidade) {
        const weekMap = { "domingo": 0, "segunda-feira": 1, "terça-feira": 2, "quarta-feira": 3, "quinta-feira": 4, "sexta-feira": 5, "sábado": 6 };
        const targetDay = weekMap[diaDaSemana.toLowerCase()];
        if (typeof targetDay === 'undefined') return [];

        let results = [];
        let date = new Date();
        date.setHours(0, 0, 0, 0);

        // Avança até o próximo dia da semana alvo
        while (date.getDay() !== targetDay) {
            date.setDate(date.getDate() + 1);
        }

        // Gera as próximas N datas quinzenais
        for (let i = 0; i < quantidade; i++) {
            results.push(new Date(date));
            date.setDate(date.getDate() + 14); // Pula 14 dias
        }
        return results;
    }

    // Calcula a capacidade máxima de um horário (em vagas de 30 min)
    function calculateCapacity(inicio, fim) {
        const [startH, startM] = inicio.split(':').map(Number);
        const [endH, endM] = fim.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        return Math.floor((endMinutes - startMinutes) / 30);
    }
    
    // Renderiza as opções de data no modal
    function renderDates(horariosDisponiveis) {
        datasContainer.innerHTML = ''; // Limpa o container
        
        if (horariosDisponiveis.length === 0) {
            datasContainer.innerHTML = '<p>Nenhuma data disponível para agendamento no momento.</p>';
            confirmBtn.disabled = true;
            return;
        }

        horariosDisponiveis.forEach((slot, index) => {
            const date = slot.date;
            const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const horarioInfo = `${slot.horario.dia} das ${slot.horario.inicio} às ${slot.horario.fim}`;
            const vagasRestantes = slot.capacity - slot.booked;

            const radioId = `date-${index}`;
            const disabled = vagasRestantes <= 0 ? 'disabled' : '';

            const optionHtml = `
                <div class="date-option ${disabled}">
                    <input type="radio" id="${radioId}" name="data_agendamento" value="${date.toISOString()}" ${disabled}>
                    <label for="${radioId}">
                        <strong>${formattedDate}</strong> (${horarioInfo})
                        <span>Vagas restantes: ${vagasRestantes}</span>
                    </label>
                </div>
            `;
            datasContainer.innerHTML += optionHtml;
        });
        confirmBtn.disabled = false;
    }

    // Função principal que abre e prepara o modal de agendamento
    async function open(supervisorUid) {
        currentSupervisor = window.fetchedSupervisors.find(s => s.uid === supervisorUid);
        if (!currentSupervisor) {
            alert("Erro: Supervisor não encontrado.");
            return;
        }

        // Resetar o modal para o estado inicial
        titleEl.textContent = `Agendar Supervisão`;
        supervisorNameEl.textContent = currentSupervisor.nome;
        step1.style.display = 'block';
        step2.style.display = 'none';
        confirmBtn.style.display = 'inline-block';
        nomeProfissionalInput.value = '';
        contatoProfissionalInput.value = '';
        datasContainer.innerHTML = '<p>Calculando datas disponíveis...</p>';
        modal.style.display = 'flex';

        // 1. Calcular as datas base
        let potentialSlots = [];
        currentSupervisor.diasHorarios.forEach(horario => {
            const dates = getNextDates(horario.dia, 5); // Gera as próximas 5 ocorrências quinzenais
            dates.forEach(date => {
                const [h, m] = horario.inicio.split(':');
                date.setHours(h, m, 0, 0);
                potentialSlots.push({ date, horario });
            });
        });

        // 2. Verificar a disponibilidade de cada data no Firestore
        const agendamentosRef = db.collection('agendamentos');
        const slotChecks = potentialSlots.map(async slot => {
            const querySnapshot = await agendamentosRef
                .where('supervisorUid', '==', currentSupervisor.uid)
                .where('dataAgendamento', '==', slot.date.toISOString())
                .get();
            
            slot.booked = querySnapshot.size;
            slot.capacity = calculateCapacity(slot.horario.inicio, slot.horario.fim);
            return slot;
        });

        const finalSlots = await Promise.all(slotChecks);
        renderDates(finalSlots);
    }
    
    // Função para salvar o agendamento
    async function handleConfirmAgendamento() {
        const nome = nomeProfissionalInput.value.trim();
        const contato = contatoProfissionalInput.value.trim();
        const selectedRadio = datasContainer.querySelector('input[name="data_agendamento"]:checked');

        if (!selectedRadio) {
            alert("Por favor, selecione uma data para o agendamento.");
            return;
        }
        if (!nome || !contato) {
            alert("Por favor, preencha seu nome e contato.");
            return;
        }

        const dataAgendamento = selectedRadio.value;
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Aguarde...';

        try {
            // Usa uma transação para garantir que não haja agendamentos duplicados
            await db.runTransaction(async (transaction) => {
                const agendamentosRef = db.collection('agendamentos');
                const query = agendamentosRef
                    .where('supervisorUid', '==', currentSupervisor.uid)
                    .where('dataAgendamento', '==', dataAgendamento);
                
                const snapshot = await transaction.get(query);
                
                const horarioInfo = currentSupervisor.diasHorarios.find(h => {
                     return getNextDates(h.dia, 10).some(d => {
                        const [hr, min] = h.inicio.split(':');
                        d.setHours(hr, min, 0, 0);
                        return d.toISOString() === dataAgendamento;
                    });
                });

                if (!horarioInfo) throw new Error("Horário base não encontrado.");

                const capacity = calculateCapacity(horarioInfo.inicio, horarioInfo.fim);

                if (snapshot.size >= capacity) {
                    throw new Error("Desculpe, todas as vagas para este horário foram preenchidas.");
                }

                // Se houver vagas, cria o novo agendamento
                const newDocRef = agendamentosRef.doc();
                transaction.set(newDocRef, {
                    supervisorUid: currentSupervisor.uid,
                    supervisorNome: currentSupervisor.nome,
                    dataAgendamento: dataAgendamento,
                    profissionalNome: nome,
                    profissionalContato: contato,
                    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
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
    
    // --- Event Listeners ---
    if (modal) {
        modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.style.display = 'none');
        cancelBtn.addEventListener('click', () => modal.style.display = 'none');
        confirmBtn.addEventListener('click', handleConfirmAgendamento);
    }
    
    // Expõe a função "open" globalmente para ser chamada por outros scripts
    window.agendamentoController = {
        open: open
    };
})();