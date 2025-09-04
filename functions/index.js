// Importa os módulos necessários usando a sintaxe moderna (V2)
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Inicializa o Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * VERSÃO APRIMORADA DA FUNÇÃO AUXILIAR
 * Gera um username único com uma lógica mais natural antes de usar números.
 * A lógica segue a ordem:
 * 1. Tenta "PrimeiroNome UltimoNome"
 * 2. Tenta "PrimeiroNome InicialDoMeio. UltimoNome"
 * 3. Tenta "PrimeiroNome PrimeiroNomeDoMeio UltimoNome"
 * 4. Como ÚLTIMO RECURSO, tenta "PrimeiroNome UltimoNome 2", etc.
 * @param {string} nomeCompleto O nome completo do usuário.
 * @returns {Promise<string>} Uma promessa que resolve com o username único.
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
        const query = db.collection("usuarios").where("username", "==", username).limit(1);
        const snapshot = await query.get();
        return !snapshot.empty;
    };

    // Tentativa 1: PrimeiroNome UltimoNome (Ex: "Marco Silva")
    const usernameBase = `${primeiroNome} ${ultimoNome}`.trim();
    if (!await checkUsernameExists(usernameBase)) {
        return usernameBase;
    }

    // Tentativa 2: PrimeiroNome InicialDoMeio. UltimoNome (Ex: "Marco A. Silva")
    if (nomesMeio.length > 0) {
        const inicialMeio = nomesMeio[0].charAt(0).toUpperCase();
        let usernameComInicial = `${primeiroNome} ${inicialMeio}. ${ultimoNome}`.trim();
        if (!await checkUsernameExists(usernameComInicial)) {
            return usernameComInicial;
        }
    }

    // Tentativa 3: PrimeiroNome PrimeiroNomeDoMeio UltimoNome (Ex: "Marco Antonio Silva")
    if (nomesMeio.length > 0) {
        const primeiroNomeMeio = nomesMeio[0];
        let usernameComNomeMeio = `${primeiroNome} ${primeiroNomeMeio} ${ultimoNome}`.trim();
        if (!await checkUsernameExists(usernameComNomeMeio)) {
            return usernameComNomeMeio;
        }
    }

    // Tentativa 4 (Último Recurso): Adicionar números (Ex: "Marco Silva 2")
    let contador = 2;
    while (true) {
        let usernameNumerado = `${usernameBase} ${contador}`;
        if (!await checkUsernameExists(usernameNumerado)) {
            return usernameNumerado;
        }
        contador++;
        // Limite de segurança para evitar loop infinito
        if (contador > 100) {
            // Se nem assim conseguir, retorna um erro para o admin.
            throw new HttpsError("internal", "Não foi possível gerar um username único após 100 tentativas.");
        }
    }
}


/**
 * Função para criar um novo profissional (código principal inalterado)
 * Apenas chama a nova versão do gerador de username.
 */
exports.criarNovoProfissional = onCall(async (request) => {
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
        
        // CHAMA A NOVA FUNÇÃO APRIMORADA PARA GERAR O USERNAME
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
            username: usernameUnico, // USA O USERNAME ÚNICO GERADO
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
 * Função para criar usuário com dados (código principal inalterado)
 * Apenas chama a nova versão do gerador de username.
 */
exports.criarUsuarioComDados = onCall(async (request) => {
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

        // CHAMA A NOVA FUNÇÃO APRIMORADA PARA GERAR O USERNAME
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
            username: usernameUnico, // USA O USERNAME ÚNICO GERADO
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
