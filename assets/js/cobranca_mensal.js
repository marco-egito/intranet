// SUBSTITUA A FUNÇÃO ANTIGA "migrarChavesDeCobranca" POR ESTA VERSÃO APRIMORADA

/**
 * FUNÇÃO DE MIGRAÇÃO (VERSÃO 2 - MAIS ROBUSTA)
 * Converte as chaves de cobrança baseadas em nome para chaves baseadas em UID.
 * Usa um mapa de busca para ser mais rápido e evitar timeouts.
 */
exports.migrarChavesDeCobranca = onCall(async (request) => {
    // Segurança: Apenas admins podem executar esta função
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
    }
    const adminDoc = await db.collection("usuarios").doc(request.auth.uid).get();
    if (!adminDoc.exists || !adminDoc.data().funcoes?.includes("admin")) {
        throw new HttpsError("permission-denied", "Você não tem permissão para executar esta operação.");
    }

    console.log("Iniciando migração de chaves de cobrança (V2)...");

    const [usuariosSnapshot, configDoc] = await Promise.all([
        db.collection("usuarios").get(),
        db.collection("financeiro").doc("configuracoes").get(),
    ]);

    if (!configDoc.exists) {
        throw new HttpsError("not-found", "Documento de configurações não encontrado.");
    }

    const usuarios = usuariosSnapshot.docs.map(doc => doc.data());
    const oldCobrancaData = configDoc.data().cobranca || {};
    const newCobrancaData = JSON.parse(JSON.stringify(oldCobrancaData));
    let chavesMigradas = 0;
    let chavesNaoEncontradas = [];

    // Passo 1: Criar um mapa de busca eficiente (PrimeiroNome UltimoNome -> [lista de usuários])
    const userSearchMap = new Map();
    usuarios.forEach(user => {
        if (user.nome) {
            const parts = user.nome.trim().split(/\s+/);
            if (parts.length > 0) {
                const searchKey = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
                if (!userSearchMap.has(searchKey)) {
                    userSearchMap.set(searchKey, []);
                }
                userSearchMap.get(searchKey).push(user);
            }
        }
    });

    // Passo 2: Iterar sobre os dados antigos e usar o mapa para encontrar correspondências
    for (const year in newCobrancaData) {
        for (const oldKey in newCobrancaData[year]) {
            // Ignora chaves que já parecem ser UIDs (28 caracteres alfanuméricos)
            if (oldKey.length === 28 && /^[a-zA-Z0-9]+$/.test(oldKey)) {
                continue;
            }

            const oldKeyParts = oldKey.replace(/_/g, " ").trim().split(/\s+/);
            const searchKey = oldKeyParts.length > 1 ? `${oldKeyParts[0]} ${oldKeyParts[oldKeyParts.length - 1]}` : oldKeyParts[0];
            
            const potentialMatches = userSearchMap.get(searchKey);

            if (potentialMatches && potentialMatches.length === 1) {
                const user = potentialMatches[0];
                if (user && user.uid) {
                    if (!newCobrancaData[year][user.uid]) {
                        console.log(`Migrando chave: "${oldKey}" para UID: "${user.uid}"`);
                        newCobrancaData[year][user.uid] = newCobrancaData[year][oldKey];
                        delete newCobrancaData[year][oldKey];
                        chavesMigradas++;
                    }
                }
            } else {
                console.log(`Não foi possível encontrar uma correspondência única para a chave antiga: "${oldKey}"`);
                chavesNaoEncontradas.push(oldKey);
            }
        }
    }

    if (chavesMigradas > 0) {
        console.log(`Atualizando documento com ${chavesMigradas} chaves migradas...`);
        await db.collection("financeiro").doc("configuracoes").update({
            cobranca: newCobrancaData
        });
    }

    const message = `Migração concluída. ${chavesMigradas} chaves foram migradas com sucesso.`;
    console.log(message);
    return { status: "success", message, chavesNaoEncontradas };
});
