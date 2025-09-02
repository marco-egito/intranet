// assets/js/controle_pagamentos.js
(function() {
    if (!db) {
        console.error("Instância do Firestore (db) não encontrada.");
        return;
    }

    const appContent = document.getElementById('pagamentos-content');
    let DB = { profissionais: [], cobranca: {}, repasses: {} };
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
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
            
            DB.cobranca = configData.cobranca || {};
            DB.repasses = configData.repasses || {};
            
            const d = new Date();
            renderPagamentos(d.getFullYear(), d.getMonth());
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            appContent.innerHTML = `<p style="color:red;">Erro ao carregar dados do Firestore.</p>`;
        }
    }

    function renderPagamentos(ano, mesIndex) {
        const mes = meses[mesIndex];
        const vencimento = new Date(ano, parseInt(mesIndex) + 1, 10).toLocaleDateString('pt-BR'); // Dia 10 do mês seguinte
        const currentYear = new Date().getFullYear();
        let years = [];
        for (let i = currentYear -1; i <= currentYear + 5; i++) { years.push(i); }

        let selectorHtml = `<div class="period-selector"><label>Selecionar Período:</label>
            <select id="repasse-mes-selector">${meses.map((m, i) => `<option value="${i}" ${i === mesIndex ? 'selected' : ''}>${m.charAt(0).toUpperCase() + m.slice(1)}</option>`).join('')}</select>
            <select id="repasse-ano-selector">${years.map(y => `<option value="${y}" ${y === ano ? 'selected' : ''}>${y}</option>`).join('')}</select>
        </div>`;
        let tableHtml = `<div class="table-wrapper"><table><thead><tr><th>Profissional</th><th>Data Vencimento</th><th>Valor a Pagar (R$)</th><th>Data Pagamento</th><th>Ação</th></tr></thead><tbody>`;
        
        const profissionaisFiltrados = (DB.profissionais || []).filter(prof => !prof.primeiraFase && !prof.inativo);
        
        profissionaisFiltrados.sort((a,b) => a.nome.localeCompare(b.nome));
        
        profissionaisFiltrados.forEach(prof => {
            const nomeKey = sanitizeKey(prof.nome);
            const valorDevido = (DB.cobranca[ano]?.[nomeKey]?.[mes]) || 0;
            const repasseSalvo = (DB.repasses[ano]?.[mes]?.[nomeKey]) || '';
            
            if (valorDevido > 0) {
                tableHtml += `<tr data-nome-key="${nomeKey}"><td>${prof.nome}</td><td>${vencimento}</td><td>R$ ${valorDevido.toFixed(2)}</td>
                    <td><input type="date" class="repasse-data-pg" value="${repasseSalvo || ''}"></td>
                    <td><button class="save-row-btn save-repasse-btn">Salvar</button></td></tr>`;
            }
        });
        
        appContent.innerHTML = selectorHtml + tableHtml + `</tbody></table></div>`;
    }

    appContent.addEventListener('change', function(e) {
        if (e.target.id === 'repasse-mes-selector' || e.target.id === 'repasse-ano-selector') {
            const ano = document.getElementById('repasse-ano-selector').value;
            const mesIndex = document.getElementById('repasse-mes-selector').value;
            renderPagamentos(parseInt(ano), parseInt(mesIndex));
        }
    });
    
    appContent.addEventListener('click', async function(e) {
        const target = e.target;
        if (target.classList.contains('save-repasse-btn')) {
            target.disabled = true;
            target.textContent = '...';

            const row = target.closest('tr');
            const nomeKey = row.dataset.nomeKey;
            const dataPg = row.querySelector('.repasse-data-pg').value;
            const ano = document.getElementById('repasse-ano-selector').value;
            const mesIndex = document.getElementById('repasse-mes-selector').value;
            const mes = meses[mesIndex];
            
            const nomeProfissional = row.cells[0].textContent;
            const valor = parseFloat(row.cells[2].textContent.replace('R$ ', ''));
            const vencimentoDate = new Date(ano, parseInt(mesIndex) + 1, 10);
            const dataVencimento = vencimentoDate.toISOString().split('T')[0];
            const descricaoBusca = `Recebimento - ${nomeProfissional} (Ref. ${mes}/${ano})`;
            
            try {
                // Atualiza o registro de repasse
                const repassePath = `repasses.${ano}.${mes}.${nomeKey}`;
                const repasseUpdate = {};
                if (dataPg) {
                    repasseUpdate[repassePath] = dataPg;
                } else {
                    repasseUpdate[repassePath] = firebase.firestore.FieldValue.delete();
                }
                await db.collection('financeiro').doc('configuracoes').update(repasseUpdate);

                // Lida com o Fluxo de Caixa
                const fluxoCaixaQuery = await db.collection('fluxoCaixa').where('descricao', '==', descricaoBusca).get();

                if (dataPg) { // Se tem data, cria ou atualiza o lançamento
                    const novoLancamento = {
                        descricao: descricaoBusca, valor, tipo: 'receita', categoria: 'Recebimento Profissional',
                        dataVencimento, dataPagamento: dataPg, status: 'pago',
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    if (fluxoCaixaQuery.empty) {
                        await db.collection('fluxoCaixa').add(novoLancamento);
                    } else {
                        await db.collection('fluxoCaixa').doc(fluxoCaixaQuery.docs[0].id).update(novoLancamento);
                    }
                } else { // Se não tem data, remove o lançamento
                    if (!fluxoCaixaQuery.empty) {
                        await db.collection('fluxoCaixa').doc(fluxoCaixaQuery.docs[0].id).delete();
                    }
                }

                // Atualiza a UI
                target.textContent = 'Salvo!';
                target.style.backgroundColor = '#28a745';
                setTimeout(() => {
                    target.disabled = false;
                    target.textContent = 'Salvar';
                    target.style.backgroundColor = '#17a2b8';
                }, 2000);
                
                // Atualiza o DB local para não precisar recarregar
                if (!DB.repasses[ano]) DB.repasses[ano] = {};
                if (!DB.repasses[ano][mes]) DB.repasses[ano][mes] = {};
                if (dataPg) DB.repasses[ano][mes][nomeKey] = dataPg; else delete DB.repasses[ano][mes][nomeKey];

            } catch(err) {
                window.showToast('Erro ao salvar!', 'error');
                target.disabled = false;
                target.textContent = 'Salvar';
                console.error(err);
            }
        }
    });
    
    fetchData();
})();
