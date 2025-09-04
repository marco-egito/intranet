(function() {
    if (!db) {
        console.error("Instância do Firestore (db) não encontrada.");
        return;
    }
    const appContent = document.querySelector('#grade-horarios-view #app-content');
    if (!appContent) return;
    let listaProfissionais = [];
    let dadosDasGrades = {};
    const horarios = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
    const diasDaSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const diasDaSemanaNomes = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const colunasPresencial = ['Leila Tardivo', 'Leonardo Abrahão', 'Karina Okajima Fukumitsu', 'Maria Júlia Kovacs', 'Christian Dunker', 'Maria Célia Malaquias (Grupo)'];
    
    function createDropdownOptions() {
        return '<option value=""></option>' + listaProfissionais.map(prof => `<option value="${prof.username}">${prof.username}</option>`).join('');
    }

    function renderGrade(tipo, dia) {
        if (!appContent) return;
        appContent.innerHTML = '';
        const weekTabsNav = document.createElement('div');
        weekTabsNav.className = 'tab-nav';
        diasDaSemanaNomes.forEach((nomeDia, index) => {
            const diaKey = diasDaSemana[index];
            weekTabsNav.innerHTML += `<button class="${dia === diaKey ? 'active' : ''}" data-day="${diaKey}">${nomeDia}</button>`;
        });
        appContent.appendChild(weekTabsNav);
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        let headers = ['Período', 'Horário'];
        headers = headers.concat(tipo === 'online' ? Array(6).fill('Online') : colunasPresencial);
        thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

        horarios.forEach((hora, index) => {
            const row = tbody.insertRow();
            if (index < 5) row.className = 'periodo-manha';
            else if (index < 11) row.className = 'periodo-tarde';
            else row.className = 'periodo-noite';
            if (index === 0) row.innerHTML += `<td class="period-cell" rowspan="5">Manhã</td>`;
            if (index === 5) row.innerHTML += `<td class="period-cell" rowspan="6">Tarde</td>`;
            if (index === 11) row.innerHTML += `<td class="period-cell" rowspan="5">Noite</td>`;
            row.innerHTML += `<td class="hour-cell">${hora}</td>`;
            for(let i=0; i < (tipo === 'online' ? 6 : colunasPresencial.length); i++) {
                const cell = row.insertCell();
                const dropdown = document.createElement('select');
                dropdown.innerHTML = createDropdownOptions();
                
                // ---- CORREÇÃO DO BUG AQUI ----
                // Busca o valor usando o mesmo formato com hífen que foi salvo
                const horaFormatada = hora.replace(":", "-");
                const fullPath = `${tipo}.${dia}.${horaFormatada}.col${i}`;
                const savedValue = dadosDasGrades[fullPath] || '';
                dropdown.value = savedValue;
                
                cell.appendChild(dropdown);
            }
        });
        table.append(thead, tbody);
        tableWrapper.appendChild(table);
        appContent.appendChild(tableWrapper);
    }

    async function init() {
        try {
            const q = db.collection("usuarios").where("fazAtendimento", "==", true).orderBy("nome");
            const querySnapshot = await q.get();
            listaProfissionais = querySnapshot.docs.map(doc => doc.data());
            const gradesDocRef = db.collection('administrativo').doc('grades');
            gradesDocRef.onSnapshot((doc) => {
                dadosDasGrades = doc.exists ? doc.data() : {};
                const mainTabsContainer = document.querySelector('#grade-horarios-view #main-tabs');
                if (!mainTabsContainer) return;
                const activeMainTabEl = mainTabsContainer.querySelector('button.active');
                const activeDayTabEl = appContent.querySelector('.tab-nav button.active');
                if (activeMainTabEl && activeDayTabEl) {
                    const activeMainTab = activeMainTabEl.dataset.tab;
                    const activeDayTab = activeDayTabEl.dataset.day;
                    renderGrade(activeMainTab, activeDayTab);
                }
            });
            renderGrade('online', 'segunda');
        } catch (error) {
            console.error("Erro ao inicializar:", error);
            appContent.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar dados.</p>`;
        }
    }

    async function autoSaveChange(selectElement) {
        const row = selectElement.closest('tr');
        const horaCell = row.querySelector('.hour-cell');
        if (!horaCell) return;
        const hora = horaCell.textContent.replace(":", "-");
        const colIndex = selectElement.closest('td').cellIndex - (row.querySelector('.period-cell') ? 2 : 1);
        const newValue = selectElement.value;
        const mainTabsContainer = document.querySelector('#grade-horarios-view #main-tabs');
        if (!mainTabsContainer) return;
        const activeMainTab = mainTabsContainer.querySelector('button.active').dataset.tab;
        const activeDayTab = appContent.querySelector('.tab-nav button.active').dataset.day;
        const fieldPath = `${activeMainTab}.${activeDayTab}.${hora}.col${colIndex}`;
        selectElement.classList.add('is-saving');
        selectElement.classList.remove('is-saved', 'is-error');
        try {
            const gradesDocRef = db.collection('administrativo').doc('grades');
            await gradesDocRef.set({ [fieldPath]: newValue }, { merge: true });
            selectElement.classList.remove('is-saving');
            selectElement.classList.add('is-saved');
            setTimeout(() => selectElement.classList.remove('is-saved'), 1500);
        } catch (err) {
            console.error("Erro ao salvar:", err);
            selectElement.classList.remove('is-saving');
            selectElement.classList.add('is-error');
            setTimeout(() => selectElement.classList.remove('is-error'), 2000);
        }
    }

    const mainTabsContainer = document.querySelector('#grade-horarios-view #main-tabs');
    if (mainTabsContainer) {
        mainTabsContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                mainTabsContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                renderGrade(e.target.dataset.tab, 'segunda');
            }
        });
    }

    appContent.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.closest('.tab-nav')) {
            if (!mainTabsContainer) return;
            const activeMainTab = mainTabsContainer.querySelector('button.active').dataset.tab;
            if(e.target.dataset.day){
                 appContent.querySelectorAll('.tab-nav button').forEach(b => b.classList.remove('active'));
                 e.target.classList.add('active');
                 renderGrade(activeMainTab, e.target.dataset.day);
            }
        }
    });

    appContent.addEventListener('change', (e) => {
        if (e.target.tagName === 'SELECT') {
            autoSaveChange(e.target);
        }
    });
    
    init();
})();
