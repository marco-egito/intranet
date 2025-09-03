// assets/js/dashboard.js
(function() {
    if (!db) { return; }

    const appContent = document.getElementById('dashboard-content');
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    let allLancamentos = [];
    let chartInstances = {}; // Guarda as instâncias dos gráficos para destruí-las depois

    function formatCurrency(value) { return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    function formatDate(dateStr) { return dateStr ? dateStr.split('-').reverse().join('/') : '---'; }

    // Renderiza a estrutura principal da página
    function renderLayout() {
        const currentYear = new Date().getFullYear();
        let yearsHtml = '';
        for (let y = currentYear - 3; y <= currentYear + 1; y++) {
            yearsHtml += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`;
        }

        appContent.innerHTML = `
            <div class="controls-section">
                <div><label><strong>Período:</strong></label> <select id="dashboard-mes-selector"></select> <select id="dashboard-ano-selector">${yearsHtml}</select></div>
                <div>
                    <button id="update-dashboard-btn" class="action-button btn-update">Atualizar Dashboard</button>
                    <button id="export-pdf-btn" class="action-button btn-pdf">Exportar PDF</button>
                </div>
            </div>
            <div class="summary-cards">
                <div class="card receitas"><h3>Receitas Pagas (Mês)</h3><p id="total-receitas">R$ 0,00</p></div>
                <div class="card despesas"><h3>Despesas Pagas (Mês)</h3><p id="total-despesas">R$ 0,00</p></div>
                <div class="card atrasadas"><h3>Despesas Atrasadas</h3><p id="total-atrasadas">R$ 0,00</p></div>
                <div class="card saldo"><h3>Saldo do Mês</h3><p id="saldo-total">R$ 0,00</p></div>
            </div>
            <div class="table-section">
                <h2>Contas a Pagar em Atraso</h2>
                <table id="atraso-table"><thead><tr><th>Vencimento</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead><tbody></tbody></table>
            </div>
            <div class="table-section">
                <h2>Contas a Pagar (Mês Selecionado)</h2>
                <table id="contas-a-pagar-table"><thead><tr><th>Vencimento</th><th>Pagamento</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Ação</th></tr></thead><tbody></tbody></table>
            </div>
            <div class="table-section">
                <h2>Entradas (Mês Selecionado)</h2>
                <table id="entradas-table"><thead><tr><th>Vencimento</th><th>Pagamento</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead><tbody></tbody></table>
            </div>
            <div class="chart-section-wrapper">
                <h2>Análise Gráfica</h2>
                <div class="chart-section">
                    <div class="chart-section-title"><h3>Evolução Financeira (Últimos 12 Meses)</h3></div>
                    <canvas id="evolucaoMensalChart"></canvas>
                </div>
                <div class="charts-grid">
                    <div class="chart-section">
                        <div class="chart-section-title"><h3>Despesas por Categoria (Mês)</h3></div>
                        <canvas id="despesasCategoriaChart"></canvas>
                    </div>
                    <div class="chart-section">
                        <div class="chart-section-title"><h3>Receitas por Categoria (Mês)</h3></div>
                        <canvas id="receitasCategoriaChart"></canvas>
                    </div>
                </div>
            </div>`;
        
        const mesSelector = document.getElementById('dashboard-mes-selector');
        const currentMonth = new Date().getMonth();
        mesSelector.innerHTML = meses.map((m, i) => `<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${m}</option>`).join('');
        
        document.getElementById('update-dashboard-btn').addEventListener('click', updateDashboard);
        document.getElementById('export-pdf-btn').addEventListener('click', generatePDFReport);
        document.getElementById('contas-a-pagar-table').addEventListener('click', handleSavePayment);
    }

    function updateDashboard() {
        const mes = parseInt(document.getElementById('dashboard-mes-selector').value);
        const ano = parseInt(document.getElementById('dashboard-ano-selector').value);
        const hoje = new Date().toISOString().split('T')[0];

        // Filtros
        const lancamentosPagosNoMes = allLancamentos.filter(l => l.dataPagamento && new Date(l.dataPagamento).getMonth() === mes && new Date(l.dataPagamento).getFullYear() === ano);
        const contasAtrasadas = allLancamentos.filter(l => l.tipo === 'despesa' && l.status === 'pendente' && l.dataVencimento < hoje);
        
        // Cálculos para os Cards
        const receitasPagas = lancamentosPagosNoMes.filter(l => l.tipo === 'receita').reduce((sum, l) => sum + l.valor, 0);
        const despesasPagas = lancamentosPagosNoMes.filter(l => l.tipo === 'despesa').reduce((sum, l) => sum + l.valor, 0);
        const despesasAtrasadasTotal = contasAtrasadas.reduce((sum, l) => sum + l.valor, 0);

        // Atualiza os Cards
        document.getElementById('total-receitas').textContent = formatCurrency(receitasPagas);
        document.getElementById('total-despesas').textContent = formatCurrency(despesasPagas);
        document.getElementById('saldo-total').textContent = formatCurrency(receitasPagas - despesasPagas);
        document.getElementById('total-atrasadas').textContent = formatCurrency(despesasAtrasadasTotal);
        
        // Atualiza as Tabelas e Gráficos
        renderMonthlyTables(mes, ano);
        updateAtrasoTable(contasAtrasadas);
        updateCharts(lancamentosPagosNoMes);
    }
    
    function renderMonthlyTables(mes, ano) {
        const despesasTbody = document.getElementById('contas-a-pagar-table').querySelector('tbody');
        const receitasTbody = document.getElementById('entradas-table').querySelector('tbody');
        
        const lancamentosDoPeriodo = allLancamentos.filter(l => {
            const dataRef = new Date(l.dataVencimento); // Filtra por vencimento
            return dataRef.getUTCMonth() === mes && dataRef.getUTCFullYear() === ano;
        });

        const despesas = lancamentosDoPeriodo.filter(l => l.tipo === 'despesa').sort((a,b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));
        const receitas = lancamentosDoPeriodo.filter(l => l.tipo === 'receita').sort((a,b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));

        despesasTbody.innerHTML = despesas.length === 0 
            ? '<tr><td colspan="6">Nenhuma conta a pagar neste período.</td></tr>'
            : despesas.map(l => `<tr>
                <td>${formatDate(l.dataVencimento)}</td> <td>${l.status === 'pago' ? formatDate(l.dataPagamento) : 'Pendente'}</td>
                <td>${l.descricao}</td> <td>${l.categoria}</td>
                <td class="text-despesa">${formatCurrency(l.valor)}</td>
                <td>${l.status === 'pago' ? 'Pago' : `<div class="pay-action-group"><input type="date" class="pay-date-input" value="${new Date().toISOString().split('T')[0]}"><button class="action-button save-payment-btn" data-id="${l.id}">Pagar</button></div>`}</td>
            </tr>`).join('');

        receitasTbody.innerHTML = receitas.length === 0 
            ? '<tr><td colspan="5">Nenhuma entrada neste período.</td></tr>'
            : receitas.map(l => `<tr>
                <td>${formatDate(l.dataVencimento)}</td> <td>${formatDate(l.dataPagamento)}</td>
                <td>${l.descricao}</td> <td>${l.categoria}</td>
                <td class="text-receita">${formatCurrency(l.valor)}</td>
            </tr>`).join('');
    }

    function updateAtrasoTable(contasAtrasadas) {
        const tbody = document.getElementById('atraso-table').querySelector('tbody');
        contasAtrasadas.sort((a,b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));
        tbody.innerHTML = contasAtrasadas.length === 0 
            ? '<tr><td colspan="4">Nenhuma conta em atraso.</td></tr>'
            : contasAtrasadas.map(l => `<tr><td>${formatDate(l.dataVencimento)}</td><td>${l.descricao}</td><td>${l.categoria}</td><td>${formatCurrency(l.valor)}</td></tr>`).join('');
    }

    async function handleSavePayment(e) {
        if (!e.target.classList.contains('save-payment-btn')) return;
        
        const btn = e.target;
        btn.disabled = true;
        const lancamentoId = btn.dataset.id;
        const dateInput = btn.previousElementSibling;
        const dataPagamento = dateInput.value;

        if (dataPagamento) {
            try {
                await db.collection('fluxoCaixa').doc(lancamentoId).update({ dataPagamento: dataPagamento, status: 'pago' });
                window.showToast('Pagamento registrado com sucesso!', 'success');
                // O listener do onSnapshot irá atualizar a UI automaticamente
            } catch (err) {
                window.showToast('Erro ao registrar pagamento.', 'error');
                btn.disabled = false;
            }
        } else {
            window.showToast('Por favor, selecione uma data.', 'error');
            btn.disabled = false;
        }
    }

    function updateCharts(lancamentosPagosNoMes) {
        const chartsToUpdate = [
            { id: 'evolucaoMensalChart', func: updateEvolucaoChart, data: null },
            { id: 'despesasCategoriaChart', func: updateDespesasCategoriaChart, data: lancamentosPagosNoMes },
            { id: 'receitasCategoriaChart', func: updateReceitasCategoriaChart, data: lancamentosPagosNoMes }
        ];
        chartsToUpdate.forEach(chartInfo => {
            const ctx = document.getElementById(chartInfo.id)?.getContext('2d');
            if (ctx) {
                if (chartInstances[chartInfo.id]) {
                    chartInstances[chartInfo.id].destroy();
                }
                chartInstances[chartInfo.id] = chartInfo.func(ctx, chartInfo.data);
            }
        });
    }

    function updateEvolucaoChart(ctx) {
        const labels = [];
        const receitasData = [];
        const despesasData = [];
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const mes = date.getMonth();
            const ano = date.getFullYear();
            labels.push(`${mesesAbrev[mes]}/${String(ano).slice(2)}`);
            const lancamentosPagos = allLancamentos.filter(l => l.dataPagamento && new Date(l.dataPagamento).getMonth() === mes && new Date(l.dataPagamento).getFullYear() === ano);
            receitasData.push(lancamentosPagos.filter(l => l.tipo === 'receita').reduce((sum, l) => sum + l.valor, 0));
            despesasData.push(lancamentosPagos.filter(l => l.tipo === 'despesa').reduce((sum, l) => sum + l.valor, 0));
        }
        return new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [
                { label: 'Receitas', data: receitasData, borderColor: 'rgba(40, 167, 69, 1)', backgroundColor: 'rgba(40, 167, 69, 0.1)', fill: true, tension: 0.2 },
                { label: 'Despesas', data: despesasData, borderColor: 'rgba(220, 53, 69, 1)', backgroundColor: 'rgba(220, 53, 69, 0.1)', fill: true, tension: 0.2 }
            ]}
        });
    }

    function updateDespesasCategoriaChart(ctx, lancamentosPagosNoMes) {
        const despesasPorCategoria = lancamentosPagosNoMes.filter(l => l.tipo === 'despesa').reduce((acc, l) => { acc[l.categoria] = (acc[l.categoria] || 0) + l.valor; return acc; }, {});
        return new Chart(ctx, { type: 'doughnut', data: { labels: Object.keys(despesasPorCategoria), datasets: [{ data: Object.values(despesasPorCategoria), backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#6f42c1', '#6c757d'] }] }, options: { responsive: true, maintainAspectRatio: false }});
    }
    
    function updateReceitasCategoriaChart(ctx, lancamentosPagosNoMes) {
        const receitasPorCategoria = lancamentosPagosNoMes.filter(l => l.tipo === 'receita').reduce((acc, l) => { acc[l.categoria] = (acc[l.categoria] || 0) + l.valor; return acc; }, {});
        return new Chart(ctx, { type: 'pie', data: { labels: Object.keys(receitasPorCategoria), datasets: [{ data: Object.values(receitasPorCategoria), backgroundColor: ['#28a745', '#20c997', '#90EE90', '#3CB371'] }] }, options: { responsive: true, maintainAspectRatio: false }});
    }

    function generatePDFReport() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const mes = document.getElementById('dashboard-mes-selector').options[document.getElementById('dashboard-mes-selector').selectedIndex].text;
        const ano = document.getElementById('dashboard-ano-selector').value;
        doc.setFontSize(18); 
        doc.text(`Relatório Financeiro - ${mes}/${ano}`, 14, 22);
        
        // Adiciona os cards
        const totalReceitas = document.getElementById('total-receitas').textContent;
        const totalDespesas = document.getElementById('total-despesas').textContent;
        const saldoTotal = document.getElementById('saldo-total').textContent;
        const totalAtrasadas = document.getElementById('total-atrasadas').textContent;
        doc.autoTable({
            startY: 30, theme: 'plain',
            body: [
                ['Receitas Pagas:', totalReceitas], ['Despesas Pagas:', totalDespesas],
                ['Saldo do Mês:', saldoTotal], ['Despesas Atrasadas:', totalAtrasadas]
            ]
        });

        let finalY = doc.autoTable.previous.finalY + 10;
        
        // Adiciona as tabelas
        const tabelas = [
            { title: "Contas a Pagar (Mês)", tableId: "contas-a-pagar-table" },
            { title: "Entradas (Mês)", tableId: "entradas-table" },
            { title: "Contas a Pagar em Atraso", tableId: "atraso-table" }
        ];

        tabelas.forEach(t => {
            doc.setFontSize(14);
            doc.text(t.title, 14, finalY);
            finalY += 7;
            doc.autoTable({ html: `#${t.tableId}`, startY: finalY });
            finalY = doc.autoTable.previous.finalY + 10;
        });

        doc.save(`relatorio_${mes.toLowerCase()}_${ano}.pdf`);
    }

    // Listener de dados em tempo real
    db.collection('fluxoCaixa').onSnapshot(snapshot => {
        allLancamentos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (document.getElementById('dashboard-mes-selector')) {
            updateDashboard();
        }
    }, error => {
        console.error("Erro ao ouvir fluxoCaixa: ", error);
        appContent.innerHTML = `<p style="color:red;">Erro de conexão com o banco de dados.</p>`;
    });

    renderLayout();
    setupControls();
    
})();
