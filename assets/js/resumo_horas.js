// assets/js/resumo_horas.js
(function() {
    if (!db) {
        console.error("Instância do Firestore (db) não encontrada.");
        return;
    }

    const appContent = document.getElementById('resumo-horas-content');

    async function init() {
        try {
            // Busca os dados do Firestore em paralelo
            const [usuariosSnapshot, configSnapshot] = await Promise.all([
                db.collection('usuarios').get(),
                db.collection('financeiro').doc('configuracoes').get()
            ]);

            const usuarios = usuariosSnapshot.docs.map(doc => doc.data());
            const configData = configSnapshot.exists ? configSnapshot.data() : {};
            
            const DB = {
                profissionais: usuarios,
                grades: configData.grades || {},
                valores: configData.valores || { online: 0, presencial: 0 }
            };

            let resumoCalculado = [];
            (DB.profissionais || []).forEach(prof => {
                // Pula profissionais inativos ou sem nome
                if (!prof.nome || prof.inativo) return;
                
                let horasOnline = 0, horasPresencial = 0;

                // Lógica de contagem de horas (mantida do seu script original)
                if (DB.grades.online) {
                    Object.values(DB.grades.online).forEach(dia => {
                        Object.values(dia).forEach(hora => {
                            Object.values(hora).forEach(nome => {
                                if (nome === prof.nome) horasOnline++;
                            });
                        });
                    });
                }
                if (DB.grades.presencial) {
                    Object.values(DB.grades.presencial).forEach(dia => {
                        Object.values(dia).forEach(hora => {
                            Object.values(hora).forEach(nome => {
                                if (nome === prof.nome) horasPresencial++;
                            });
                        });
                    });
                }
                
                const dividaOnline = horasOnline * (DB.valores.online || 0);
                const dividaPresencial = horasPresencial * (DB.valores.presencial || 0);

                resumoCalculado.push({
                    nome: prof.nome,
                    totalDivida: dividaOnline + dividaPresencial,
                    horasOnline,
                    horasPresencial,
                    dividaOnline,
                    dividaPresencial,
                    totalHoras: horasOnline + horasPresencial
                });
            });

            // Ordena o resultado pelo nome do profissional
            resumoCalculado.sort((a, b) => a.nome.localeCompare(b.nome));

            // Renderiza a tabela
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
                        <td>R$ ${resumo.dividaPresencial.toFixed(2)}</td>
                        <td>R$ ${resumo.dividaOnline.toFixed(2)}</td>
                        <td><strong>R$ ${resumo.totalDivida.toFixed(2)}</strong></td>
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
