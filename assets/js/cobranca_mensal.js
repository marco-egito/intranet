// assets/js/cobranca_mensal.js
(function() {
    if (!db) {
        console.error("Instância do Firestore (db) não encontrada.");
        return;
    }

    const appContent = document.getElementById('cobranca-mensal-content');
    let DB = { profissionais: [], grades: {}, valores: {}, cobranca: {}, Mensagens: {} }; // Usa 'Mensagens' com M maiúsculo
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    // Função para sanitizar nomes para serem usados como chaves em objetos
    function sanitizeKey(key) {
        if (!key) return '';
        return key.replace(/\.|\$|\[|\]|#|\//g, '_');
    }

    async function fetchData() {
        try {
            const [usuariosSnapshot, configSnapshot] = await Promise.all([
                db.collection('usuarios').get(),
                db.collection('financeiro').doc('configuracoes').get()
            ]);

            DB.profissionais = usuariosSnapshot.docs.map(doc => doc.data());
            const configData = configSnapshot.exists ? configSnapshot.data() : {};
            
            DB.grades = configData.grades || {};
            DB.valores = configData.valores || {};
            DB.cobranca = configData.cobranca || {};
            DB.Mensagens = configData.Mensagens || {}; // Usa 'Mensagens' com M maiúsculo
            
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
        (DB.profissionais || []).forEach(prof => {
            if (!prof.nome || prof.primeiraFase || prof.inativo) return;
            
            let horasOnline = 0, horasPresencial = 0;
            if (DB.grades.online) { Object.values(DB.grades.online).forEach(dia => { Object.values(dia).forEach(hora => { Object.values(hora).forEach(nome => { if (nome === prof.nome) horasOnline++; }); }); }); }
            if (DB.grades.presencial) { Object.values(DB.grades.presencial).forEach(dia => { Object.values(dia).forEach(hora => { Object.values(hora).forEach(nome => { if (nome === prof.nome) horasPresencial++; }); }); }); }
            
            const totalDivida = (horasOnline * (DB.valores.online || 0)) + (horasPresencial * (DB.valores.presencial || 0));
            resumoCalculado.push({ nome: prof.nome, totalDivida: totalDivida });
        });

        resumoCalculado.sort((a,b) => a.nome.localeCompare(b.nome));

        resumoCalculado.forEach(resumo => {
            const nomeKey = sanitizeKey(resumo.nome);
            const cobrancaProf = (DB.cobranca[ano] && DB.cobranca[ano][nomeKey]) ? DB.cobranca[ano][nomeKey] : {};
            
            let anoPassado = ano;
            let mesPassadoIndex = mesIndex - 1;
            if (mesPassadoIndex < 0) {
                mesPassadoIndex = 11;
                anoPassado--;
            }
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
                <td>R$ ${valorMesPassado.toFixed(2)}</td>
                <td>R$ ${valorParaExibir.toFixed(2)}</td>
                <td><button class="action-button edit-btn row-edit-btn">Editar</button></td>
                <td><a href="#" class="action-button whatsapp-btn" data-nome="${resumo.nome}" data-valor="${valorParaExibir.toFixed(2)}">Enviar</a></td>
            </tr>`;
        });
        
        appContent.innerHTML = selectorHtml + tableHtml + `</tbody></table></div>`;
    }

    // Gerenciador de eventos central
    appContent.addEventListener('click', async (e) => {
        const target = e.target;
        
        // Botão de editar na linha da tabela
        if (target.classList.contains('row-edit-btn')) {
            e.preventDefault();
            const row = target.closest('tr');
            const valorOriginal = parseFloat(row.dataset.valorOriginal);
            const valorCell = row.cells[2];
            const acoesCell = row.cells[3];

            valorCell.innerHTML = `<input type="number" class="edit-valor-input" step="0.01" value="${valorOriginal.toFixed(2)}">`;
            acoesCell.innerHTML = `
                <button class="action-button save-btn row-save-btn">Salvar</button>
                <button class="action-button cancel-btn row-cancel-btn">Cancelar</button>
            `;
        }

        // Botão de cancelar edição
        if (target.classList.contains('row-cancel-btn')) {
            e.preventDefault();
            const ano = parseInt(document.getElementById('cobranca-ano-selector').value);
            const mesIndex = parseInt(document.getElementById('cobranca-mes-selector').value);
            renderCobranca(ano, mesIndex);
        }

        // Botão de salvar edição da linha
        if (target.classList.contains('row-save-btn')) {
            e.preventDefault();
            target.disabled = true;
            target.textContent = 'Salvando...';

            const row = target.closest('tr');
            const nomeKey = row.dataset.nomeKey;
            const input = row.querySelector('.edit-valor-input');
            const novoValor = parseFloat(input.value);
            const ano = parseInt(document.getElementById('cobranca-ano-selector').value);
            const mesIndex = parseInt(document.getElementById('cobranca-mes-selector').value);
            const mes = meses[mesIndex];

            if (isNaN(novoValor)) {
                window.showToast('Por favor, insira um valor numérico válido.', 'error');
                renderCobranca(ano, mesIndex);
                return;
            }
            
            // Caminho dinâmico com notação de ponto para o Firestore
            const path = `cobranca.${ano}.${nomeKey}.${mes}`;
            try {
                await db.collection('financeiro').doc('configuracoes').update({ [path]: novoValor });
                
                // Atualiza o DB local para refletir a mudança
                if (!DB.cobranca[ano]) DB.cobranca[ano] = {};
                if (!DB.cobranca[ano][nomeKey]) DB.cobranca[ano][nomeKey] = {};
                DB.cobranca[ano][nomeKey][mes] = novoValor;
                
                window.showToast(`Valor para ${nomeKey.replace(/_/g, ' ')} salvo com sucesso!`, 'success');
            } catch (err) {
                console.error("Erro ao salvar:", err);
                window.showToast("Ocorreu um erro ao salvar. Tente novamente.", 'error');
            } finally {
                renderCobranca(ano, mesIndex);
            }
        }
        
        // Botão de WhatsApp
        if (target.classList.contains('whatsapp-btn')) {
            e.preventDefault();
            const nome = target.dataset.nome;
            const profInfo = DB.profissionais.find(p => p.nome === nome);
            const contato = profInfo ? profInfo.contato.replace(/\D/g, '') : '';
            if(!contato) { alert(`Contato para ${nome} não encontrado.`); return; }
            
            const template = DB.Mensagens.cobranca || 'Olá, {nomeProfissional}! Lembrete do repasse de R$ {valor} referente ao mês de {mes}.';
            const ano = document.getElementById('cobranca-ano-selector').value;
            const mes = meses[document.getElementById('cobranca-mes-selector').value];
            let message = template
                .replace('{nomeProfissional}', nome)
                .replace('{valor}', target.dataset.valor)
                .replace('{mes}', `${mes.charAt(0).toUpperCase() + mes.slice(1)}/${ano}`);
            
            window.open(`https://wa.me/55${contato}?text=${encodeURIComponent(message)}`, '_blank');
        }
    });
    
    // Event listener para os seletores de data
    appContent.addEventListener('change', function(e) {
        if (e.target.id === 'cobranca-mes-selector' || e.target.id === 'cobranca-ano-selector') {
            const ano = parseInt(document.getElementById('cobranca-ano-selector').value);
            const mesIndex = parseInt(document.getElementById('cobranca-mes-selector').value);
            renderCobranca(ano, mesIndex);
        }
    });

    // Inicia a aplicação
    fetchData();
})();
