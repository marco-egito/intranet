// assets/js/resumo_horas.js (Versão 1 - Refatorado)
(function() {
    if (!db) {
        console.error("Instância do Firestore (db) não encontrada.");
        return;
    }

    const appContent = document.getElementById('resumo-horas-content');

    async function init() {
        if (!appContent) return;
        appContent.innerHTML = '<div class="loading-spinner"></div>';

        try {
            // Busca os dados do Firestore em paralelo.
            // ALTERAÇÃO: Agora busca a grade da coleção 'administrativo'.
            const [usuariosSnapshot, gradesSnapshot, configSnapshot] = await Promise.all([
                db.collection('usuarios').orderBy('nome').get(),
                db.collection('administrativo').doc('grades').get(),
                db.collection('financeiro').doc('configuracoes').get()
            ]);

            const usuarios = usuariosSnapshot.docs.map(doc => doc.data());
            const gradesData = gradesSnapshot.exists ? gradesSnapshot.data() : {};
            const configData = configSnapshot.exists ? configSnapshot.data() : {};
            const valores = configData.valores || { online: 0, presencial: 0 };

            let resumoCalculado = [];

            // NOVA LÓGICA DE CONTAGEM DE HORAS
            usuarios.forEach(prof => {
                // Pula profissionais sem username ou inativos
                if (!prof.username || prof.inativo) return;
                
                let horasOnline = 0;
                let horasPresencial = 0;

                // Itera sobre todas as entradas na grade de horários
                for (const key in gradesData) {
                    const profissionalNaGrade = gradesData[key];

                    // Compara o username na grade com o username do profissional atual
                    if (profissionalNaGrade === prof.username) {
                        if (key.startsWith('online.')) {
                            horasOnline++;
                        } else if (key.startsWith('presencial.')) {
                            horasPresencial++;
                        }
                    }
                }
                
                const dividaOnline = horasOnline * (valores.online || 0);
                const dividaPresencial = horasPresencial * (valores.presencial || 0);

                resumoCalculado.push({
                    nome: prof.nome, // Mostra o nome completo na tabela
                    totalDivida: dividaOnline + dividaPresencial,
                    horasOnline,
                    horasPresencial,
                    dividaOnline,
                    dividaPresencial,
                    totalHoras: horasOnline + horasPresencial
                });
            });

            // O código para renderizar a tabela permanece o mesmo.
            let tableHtml = `
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Profissional</th>
                                <th>Horas Presencial</th>
                                <th>Horas Online</th>
                                <th>Total Horas</th>
                                <th>Dívida Presencial (R$)</th>
                                <th>Dívida Online (R$)</th>
                                <th>Total Dívida (R$)</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            resumoCalculado.forEach(resumo => {
                tableHtml += `
                    <tr>
                        <td>${resumo.nome}</td>
                        <td>${resumo.horasPresencial}</td>
                        <td>${resumo.horasOnline}</td>
                        <td><strong>${resumo.totalHoras}</strong></td>
                        <td>R$ ${resumo.dividaPresencial.toFixed(2).replace('.', ',')}</td>
                        <td>R$ ${resumo.dividaOnline.toFixed(2).replace('.', ',')}</td>
                        <td><strong>R$ ${resumo.totalDivida.toFixed(2).replace('.', ',')}</strong></td>
                    </tr>`;
            });

            appContent.innerHTML = tableHtml + `</tbody></table></div>`;

        } catch (error) {
            console.error("Erro ao carregar dados para o resumo de horas:", error);
            appContent.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar dados do Firestore. Verifique o console para mais detalhes.</p>`;
        }
    }

    init();
})();
