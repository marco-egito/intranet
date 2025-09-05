const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

async function gerarUsernameUnico(nomeCompleto) {
    const partesNome = nomeCompleto.trim().split(/\s+/).filter(p => p);
    if (partesNome.length === 0) {
        throw new HttpsError("invalid-argument", "O nome completo não pode estar vazio.");
    }
    const primeiroNome = partesNome[0];
    const ultimoNome = partesNome.length > 1 ? partesNome[partesNome.length - 1] : "";
    const nomesMeio = partesNome.slice(1, -1);

    const checkUsernameExists = async (username) => {
        const query = db.collection("usuarios").where("username", "==", username).limit(1);
        const snapshot = await query.get();
        return !snapshot.empty;
    };

    const usernameBase = `${primeiroNome} ${ultimoNome}`.trim();
    if (!await checkUsernameExists(usernameBase)) return usernameBase;

    if (nomesMeio.length > 0) {
        const inicialMeio = nomesMeio[0].charAt(0).toUpperCase();
        let usernameComInicial = `${primeiroNome} ${inicialMeio}. ${ultimoNome}`.trim();
        if (!await checkUsernameExists(usernameComInicial)) return usernameComInicial;
    }

    if (nomesMeio.length > 0) {
        const primeiroNomeMeio = nomesMeio[0];
        let usernameComNomeMeio = `${primeiroNome} ${primeiroNomeMeio} ${ultimoNome}`.trim();
        if (!await checkUsernameExists(usernameComNomeMeio)) return usernameComNomeMeio;
    }

    let contador = 2;
    while (true) {
        let usernameNumerado = `${usernameBase} ${contador}`;
        if (!await checkUsernameExists(usernameNumerado)) return usernameNumerado;
        contador++;
        if (contador > 100) throw new HttpsError("internal", "Não foi possível gerar um username único.");
    }
}

exports.criarNovoProfissional = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
    const adminUid = request.auth.uid;
    try {
        const adminUserDoc = await db.collection("usuarios").doc(adminUid).get();
        if (!adminUserDoc.exists || !(adminUserDoc.data().funcoes || []).some(f => ['admin', 'financeiro'].includes(f))) {
            throw new HttpsError("permission-denied", "Você não tem permissão para criar usuários.");
        }
        const data = request.data;
        const usernameUnico = await gerarUsernameUnico(data.nome);
        const senhaPadrao = "eupsico@2025";
        const userRecord = await admin.auth().createUser({ email: data.email, password: senhaPadrao, displayName: data.nome, disabled: false });
        const uid = userRecord.uid;
        const dadosParaSalvar = {
            nome: data.nome, username: usernameUnico, email: data.email, contato: data.contato,
            profissao: data.profissao, funcoes: data.funcoes, inativo: data.inativo,
            recebeDireto: data.recebeDireto, primeiraFase: data.primeiraFase,
            fazAtendimento: data.fazAtendimento, uid: uid,
        };
        await db.collection("usuarios").doc(uid).set(dadosParaSalvar);
        return { status: "success", message: `Usuário ${data.nome} criado com sucesso!` };
    } catch (error) {
        console.error("Erro detalhado ao criar profissional:", error);
        if (error instanceof HttpsError) { throw error; }
        if (error.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'O e-mail fornecido já está em uso.');
        throw new HttpsError("internal", "Ocorreu um erro inesperado.");
    }
});

exports.criarUsuarioComDados = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
    const adminUid = request.auth.uid;
    try {
        const adminUserDoc = await db.collection("usuarios").doc(adminUid).get();
        if (!adminUserDoc.exists || !(adminUserDoc.data().funcoes || []).some(f => ['admin', 'financeiro'].includes(f))) {
            throw new HttpsError("permission-denied", "Você não tem permissão para criar usuários.");
        }
        const data = request.data;
        const usernameUnico = await gerarUsernameUnico(data.nome);
        const senhaPadrao = "eupsico@2025";
        const userRecord = await admin.auth().createUser({ email: data.email, password: senhaPadrao, displayName: data.nome, disabled: false });
        const uid = userRecord.uid;
        const dadosParaSalvar = {
            nome: data.nome, username: usernameUnico, email: data.email, contato: data.contato,
            profissao: data.profissao, funcoes: data.funcoes, inativo: data.inativo,
            recebeDireto: data.recebeDireto, primeiraFase: data.primeiraFase,
            fazAtendimento: data.fazAtendimento, uid: uid,
        };
        await db.collection("usuarios").doc(uid).set(dadosParaSalvar);
        return { status: "success", message: "Operação 'criarUsuarioComDados' realizada com sucesso!" };
    } catch (error) {
        console.error("Erro em criarUsuarioComDados:", error);
        if (error instanceof HttpsError) { throw error; }
        if (error.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'O e-mail fornecido já está em uso.');
        throw new HttpsError("internal", "Ocorreu um erro em 'criarUsuarioComDados'.");
    }
    exports.migrarChavesDeCobranca = onCall(async (request) => {
    // Segurança: Apenas admins podem executar esta função
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
    }
    const adminDoc = await db.collection("usuarios").doc(request.auth.uid).get();
    if (!adminDoc.exists || !adminDoc.data().funcoes?.includes("admin")) {
        throw new HttpsError("permission-denied", "Você não tem permissão para executar esta operação.");
    }

    console.log("Iniciando migração de chaves de cobrança...");

    const [usuariosSnapshot, configDoc] = await Promise.all([
        db.collection("usuarios").get(),
        db.collection("financeiro").doc("configuracoes").get(),
    ]);

    if (!configDoc.exists) {
        throw new HttpsError("not-found", "Documento de configurações não encontrado.");
    }

    const usuarios = usuariosSnapshot.docs.map(doc => doc.data());
    const oldCobrancaData = configDoc.data().cobranca || {};
    const newCobrancaData = JSON.parse(JSON.stringify(oldCobrancaData)); // Cópia profunda
    let chavesMigradas = 0;
    let chavesNaoEncontradas = [];

    // Função auxiliar para encontrar o usuário correspondente à chave antiga
    const findUserByOldKey = (oldKey) => {
        const oldKeyParts = oldKey.replace(/_/g, " ").split(/\s+/);
        const oldFirst = oldKeyParts[0];
        const oldLast = oldKeyParts[oldKeyParts.length - 1];

        const potentialMatches = usuarios.filter(u => 
            u.nome && u.nome.startsWith(oldFirst) && u.nome.endsWith(oldLast)
        );
        
        // Retorna o usuário apenas se encontrar uma correspondência única e exata
        if (potentialMatches.length === 1) {
            return potentialMatches[0];
        }
        return null;
    };

    for (const year in newCobrancaData) {
        for (const oldKey in newCobrancaData[year]) {
            // Tenta encontrar um usuário que corresponda à chave antiga
            const user = findUserByOldKey(oldKey);

            if (user && user.uid) {
                // Se encontrou, e a nova chave (UID) ainda não existe, faz a troca
                if (!newCobrancaData[year][user.uid]) {
                    console.log(`Migrando chave: "${oldKey}" para UID: "${user.uid}"`);
                    // Copia os dados para a nova chave (UID)
                    newCobrancaData[year][user.uid] = newCobrancaData[year][oldKey];
                    // Apaga a chave antiga
                    delete newCobrancaData[year][oldKey];
                    chavesMigradas++;
                }
            } else {
                console.log(`Não foi possível encontrar uma correspondência única para a chave antiga: "${oldKey}"`);
                chavesNaoEncontradas.push(oldKey);
            }
        }
    }

    if (chavesMigradas > 0) {
        await db.collection("financeiro").doc("configuracoes").update({
            cobranca: newCobrancaData
        });
    }

    const message = `Migração concluída. ${chavesMigradas} chaves foram migradas com sucesso.`;
    console.log(message);
    return { status: "success", message, chavesNaoEncontradas };

});
