// Importa os módulos necessários
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Inicializa o Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * VERSÃO DE DEPURAÇÃO DA FUNÇÃO AUXILIAR
 * Adicionados console.log para vermos o resultado da busca no Firestore.
 */
async function gerarUsernameUnico(nomeCompleto) {
    const partesNome = nomeCompleto.trim().split(/\s+/).filter(p => p);
    if (partesNome.length === 0) {
        throw new HttpsError("invalid-argument", "O nome completo não pode estar vazio.");
    }

    const primeiroNome = partesNome[0];
    const ultimoNome = partesNome.length > 1 ? partesNome[partesNome.length - 1] : "";
    const nomesMeio = partesNome.slice(1, -1);

    const checkUsernameExists = async (username) => {
        // --- LOGS DE DEPURAÇÃO ADICIONADOS AQUI ---
        console.log(`[Debug] Verificando se o username: "${username}" existe...`);
        const query = db.collection("usuarios").where("username", "==", username).limit(1);
        const snapshot = await query.get();
        console.log(`[Debug] A busca por "${username}" encontrou ${snapshot.size} documento(s).`);
        console.log(`[Debug] O snapshot está vazio? ${snapshot.empty}.`);
        console.log(`[Debug] A função retornará: ${!snapshot.empty}.`);
        // --- FIM DOS LOGS DE DEPURAÇÃO ---
        return !snapshot.empty;
    };

    // Tentativa 1: PrimeiroNome UltimoNome
    const usernameBase = `${primeiroNome} ${ultimoNome}`.trim();
    if (!await checkUsernameExists(usernameBase)) {
        return usernameBase;
    }

    // Tentativa 2: PrimeiroNome InicialDoMeio. UltimoNome
    if (nomesMeio.length > 0) {
        const inicialMeio = nomesMeio[0].charAt(0).toUpperCase();
        let usernameComInicial = `${primeiroNome} ${inicialMeio}. ${ultimoNome}`.trim();
        if (!await checkUsernameExists(usernameComInicial)) {
            return usernameComInicial;
        }
    }

    // Tentativa 3: PrimeiroNome PrimeiroNomeDoMeio UltimoNome
    if (nomesMeio.length > 0) {
        const primeiroNomeMeio = nomesMeio[0];
        let usernameComNomeMeio = `${primeiroNome} ${primeiroNomeMeio} ${ultimoNome}`.trim();
        if (!await checkUsernameExists(usernameComNomeMeio)) {
            return usernameComNomeMeio;
        }
    }

    // Último Recurso: Adicionar números
    let contador = 2;
    while (true) {
        let usernameNumerado = `${usernameBase} ${contador}`;
        if (!await checkUsernameExists(usernameNumerado)) {
            return usernameNumerado;
        }
        contador++;
        if (contador > 100) {
            throw new HttpsError("internal", "Não foi possível gerar um username único.");
        }
    }
}

/**
 * Função principal com a marca de versão para depuração
 */
exports.criarNovoProfissional = onCall(async (request) => {
    // MENSAGEM DE VERIFICAÇÃO PRINCIPAL
    console.log("--- EXECUTANDO CÓDIGO VERSÃO 'DEBUG FINAL' ---");

    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
    }
    const adminUid = request.auth.uid;

    try {
        const adminUserDoc = await db.collection("usuarios").doc(adminUid).get();
        if (!adminUserDoc.exists || !(adminUserDoc.data().funcoes || []).some(f => ['admin', 'financeiro'].includes(f))) {
            throw new HttpsError("permission-denied", "Você não tem permissão para criar usuários.");
        }
        
        const data = request.data;
        const usernameUnico = await gerarUsernameUnico(data.nome);
        const senhaPadrao = "eupsico@2025";
        const userRecord = await admin.auth().createUser({
            email: data.email,
            password: senhaPadrao,
            displayName: data.nome,
            disabled: false,
        });

        const uid = userRecord.uid;
        const dadosParaSalvar = {
            nome: data.nome,
            username: usernameUnico,
            email: data.email,
            contato: data.contato,
            profissao: data.profissao,
            funcoes: data.funcoes,
            inativo: data.inativo,
            recebeDireto: data.recebeDireto,
            primeiraFase: data.primeiraFase,
            fazAtendimento: data.fazAtendimento,
            uid: uid,
        };

        await db.collection("usuarios").doc(uid).set(dadosParaSalvar);
        return { status: "success", message: `Usuário ${data.nome} criado com sucesso!` };
    } catch (error) {
        console.error("Erro detalhado ao criar profissional:", error);
        if (error instanceof HttpsError) { throw error; }
        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError('already-exists', 'O e-mail fornecido já está em uso.');
        }
        throw new HttpsError("internal", "Ocorreu um erro inesperado.");
    }
});

/**
 * Função secundária com a marca de versão para depuração
 */
exports.criarUsuarioComDados = onCall(async (request) => {
    // MENSAGEM DE VERIFICAÇÃO PRINCIPAL
    console.log("--- EXECUTANDO CÓDIGO VERSÃO 'DEBUG FINAL' ---");

    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
    }
    const adminUid = request.auth.uid;

    try {
        const adminUserDoc = await db.collection("usuarios").doc(adminUid).get();
        if (!adminUserDoc.exists || !(adminUserDoc.data().funcoes || []).some(f => ['admin', 'financeiro'].includes(f))) {
            throw new HttpsError("permission-denied", "Você não tem permissão para criar usuários.");
        }

        const data = request.data;
        const usernameUnico = await gerarUsernameUnico(data.nome);
        const senhaPadrao = "eupsico@2025";
        const userRecord = await admin.auth().createUser({
            email: data.email,
            password: senhaPadrao,
            displayName: data.nome,
            disabled: false,
        });
        
        const uid = userRecord.uid;
        const dadosParaSalvar = {
            nome: data.nome,
            username: usernameUnico,
            email: data.email,
            contato: data.contato,
            profissao: data.profissao,
            funcoes: data.funcoes,
            inativo: data.inativo,
            recebeDireto: data.recebeDireto,
            primeiraFase: data.primeiraFase,
            fazAtendimento: data.fazAtendimento,
            uid: uid,
        };

        await db.collection("usuarios").doc(uid).set(dadosParaSalvar);
        return { status: "success", message: "Operação 'criarUsuarioComDados' realizada com sucesso!" };
    } catch (error) {
        console.error("Erro em criarUsuarioComDados:", error);
        if (error instanceof HttpsError) { throw error; }
        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError('already-exists', 'O e-mail fornecido já está em uso.');
        }
        throw new HttpsError("internal", "Ocorreu um erro em 'criarUsuarioComDados'.");
    }
});
