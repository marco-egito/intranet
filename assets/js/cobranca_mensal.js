// assets/js/cobranca_mensal.js (Versão 1 - Refatorado)
(function() {
    if (!db) {
        console.error("Instância do Firestore (db) não encontrada.");
        return;
    }

    const appContent = document.getElementById('cobranca-mensal-content');
    let DB = { profissionais: [], grades: {}, valores: {}, cobranca: {}, Mensagens: {} };
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    function sanitizeKey(key) {
        if (!key) return '';
        return key.replace(/\.|\$|\[|\]|#|\//g, '_');
    }

    async function fetchData() {
        if (!appContent) return;
        appContent.innerHTML = '<div class="loading-spinner"></div>';
        try {
            // ALTERAÇÃO: Agora busca a grade da coleção 'administrativo' também.
            const [usuariosSnapshot, gradesSnapshot, configSnapshot] = await Promise.all([
                db.collection('usuarios').get(),
                db.collection('administrativo').doc('grades').get(),
                db.collection('financeiro').doc('configuracoes').get()
            ]);

            DB.profissionais = usuariosSnapshot.docs.map(doc => doc.data());
            DB.grades = gradesSnapshot.exists ? gradesSnapshot.data() : {}; // Dados da grade atualizados
            const configData = configSnapshot.exists ? configSnapshot.data() : {};
            
            DB.valores = configData.valores || {};
            DB.cobranca = configData.cobranca || {};
            DB.Mensagens = configData.Mensagens || {};
            
            const d = new Date();
            renderCobranca(d.getFullYear(), d.getMonth());
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            appContent.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar dados do Firestore.</p>`;
        }
    }

    function renderCobranca(ano, mesIndex) {
        const mes = meses[mesIndex];
        const date = new Date();
        const currentYear = date.getFullYear();
        const currentMonthIndex = date.getMonth();
        const isCurrentMonthView = (ano === currentYear && mesIndex === currentMonthIndex);

        let years = [];
        for (let i = currentYear - 1; i <= currentYear + 5; i++) { years.push(i); }

        let topButtonHtml = isCurrentMonthView ? `<button class="action-button save-btn" id="save-month-btn">Salvar Lançamentos Calculados para este Mês</button>` : '';

        let selectorHtml = `<div class="header-actions">
            <div class="period-selector">
                <label>Selecionar Período:</label>
                <select id="cobranca-mes-selector">${meses.map((m, i) => `<option value="${i}" ${i === mesIndex ? 'selected' : ''}>${m.charAt(0).toUpperCase() + m.slice(1)}</option>`).join('')}</select>
                <select id="cobranca-ano-selector">${years.map(y => `<option value="${y}" ${y === ano ? 'selected' : ''}>${y}</option>`).join('')}</select>
            </div>
            ${topButtonHtml}
        </div>`;
        
        let tableHtml = `<p>Lançamento de cobranças para o mês de: <strong>${mes.charAt(0).toUpperCase() + mes.slice(1)}/${ano}</strong></p>
            <div class="table-wrapper"><table id="cobranca-table"><thead><tr>
            <th>Profissional</th>
            <th>Valor Mês Passado (R$)</th>
            <th>Valor do Mês (R$)</th>
            <th>Ações</th>
            <th>WhatsApp</th>
            </tr></thead><tbody>`;
        
        let resumoCalculado = [];
        // ALTERAÇÃO: Lógica de cálculo de horas substituída pela do "Resumo de Horas"
        DB.profissionais.forEach(prof => {
            if (!prof.username || prof.inativo || prof.primeiraFase === true || prof.fazAtendimento !== true) {
                return;
            }
            
            let horasOnline = 0;
            let horasPresencial = 0;

            for (const key in DB.grades) {
                const profissionalNaGrade = DB.grades[key];
                if (profissionalNaGrade === prof.username) {
                    if (key.startsWith('online.')) {
                        horasOnline++;
                    } else if (key.startsWith('presencial.')) {
                        horasPresencial++;
                    }
                }
            }
            
            const totalDivida = (horasOnline * (DB.valores.online || 0)) + (horasPresencial * (DB.valores.presencial || 0));
            resumoCalculado.push({ nome: prof.nome, totalDivida: totalDivida });
        });

        resumoCalculado.sort((a,b) => a.nome.localeCompare(b.nome));

        resumoCalculado.forEach(resumo => {
            const nomeKey = sanitizeKey(resumo.nome);
            const cobrancaProf = (DB.cobranca[ano] && DB.cobranca[ano][nomeKey]) ? DB.cobranca[ano][nomeKey] : {};
            
            let anoPassado = ano;
            let mesPassadoIndex = mesIndex - 1;
            if (mesPassadoIndex < 0) { mesPassadoIndex = 11; anoPassado--; }
            const mesPassado = meses[mesPassadoIndex];
            const valorMesPassado = (DB.cobranca[anoPassado]?.[nomeKey]?.[mesPassado]) || 0;
            
            let valorParaExibir = 0;
            if (cobrancaProf[mes] !== undefined) {
                valorParaExibir = cobrancaProf[mes];
            } else if (isCurrentMonthView) {
                valorParaExibir = resumo.totalDivida;
            }
            
            tableHtml += `<tr data-nome-key="${nomeKey}" data-valor-original="${valorParaExibir.toFixed(2)}">
                <td>${resumo.nome}</td>
                <td>R$ ${valorMesPassado.toFixed(2).replace('.',',')}</td>
                <td>R$ ${valorParaExibir.toFixed(2).replace('.',',')}</td>
                <td><button class="action-button edit-btn row-edit-btn">Editar</button></td>
                <td><a href="#" class="action-button whatsapp-btn" data-nome="${resumo.nome}" data-valor="${valorParaExibir.toFixed(2)}">Enviar</a></td>
            </tr>`;
        });
        
        appContent.innerHTML = selectorHtml + tableHtml + `</tbody></table></div>`;
    }

    appContent.addEventListener('click', async (e) => {
        const target = e.target;
        
        if (target.classList.contains('row-edit-btn')) { /* ...código inalterado... */ }
        if (target.classList.contains('row-cancel-btn')) { /* ...código inalterado... */ }
        if (target.classList.contains('row-save-btn')) { /* ...código inalterado... */ }
        if (target.classList.contains('whatsapp-btn')) { /* ...código inalterado... */ }
    });
    
    appContent.addEventListener('change', function(e) {
        if (e.target.id === 'cobranca-mes-selector' || e.target.id === 'cobranca-ano-selector') {
            const ano = parseInt(document.getElementById('cobranca-ano-selector').value);
            const mesIndex = parseInt(document.getElementById('cobranca-mes-selector').value);
            renderCobranca(ano, mesIndex);
        }
    });

    fetchData();
})();
