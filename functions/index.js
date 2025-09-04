// Importa os módulos necessários usando a sintaxe moderna (V2)
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Inicializa o Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Função para criar um novo profissional (Versão 2).
 * Utiliza a sintaxe V2 das Cloud Functions, mais robusta para o runtime nodejs22.
 */
exports.criarNovoProfissional = onCall(async (request) => {
    // 1. Verificação de Segurança e Permissões
    // Na V2, os dados de autenticação estão em request.auth
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Você precisa estar autenticado para realizar esta operação.");
    }
    
    const adminUid = request.auth.uid;

    try {
        const adminUserDoc = await db.collection("usuarios").doc(adminUid).get();
        if (!adminUserDoc.exists) {
            throw new HttpsError("permission-denied", "Usuário administrador não encontrado no banco de dados.");
        }

        const adminFuncoes = adminUserDoc.data().funcoes || [];
        if (!adminFuncoes.includes("admin") && !adminFuncoes.includes("financeiro")) {
            throw new HttpsError("permission-denied", "Você não tem permissão para criar novos usuários.");
        }
        
        // Os dados enviados pelo cliente estão em request.data
        const data = request.data;

        // 2. Definição da senha padrão
        const senhaPadrao = "eupsico@2025";

        // 3. Criação do usuário na Autenticação
        const userRecord = await admin.auth().createUser({
            email: data.email,
            password: senhaPadrao,
            displayName: data.nome,
            disabled: false,
        });

        const uid = userRecord.uid;

        // 4. Preparação dos dados para salvar no Firestore
        const dadosParaSalvar = {
            nome: data.nome,
            username: data.username,
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

        // Salva os dados no Firestore
        await db.collection("usuarios").doc(uid).set(dadosParaSalvar);

        // 5. Retorno de sucesso
        return {
            status: "success",
            message: `Usuário ${data.nome} criado com sucesso!`
        };

    } catch (error) {
        // 6. Tratamento de Erros
        console.error("Erro detalhado ao criar profissional:", error);

        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError('already-exists', 'O e-mail fornecido já está em uso por outra conta.');
        }
        
        // Se for um erro que já formatamos, apenas o repasse.
        if (error instanceof HttpsError) {
            throw error;
        }

        // Erro genérico
        throw new HttpsError("internal", "Ocorreu um erro inesperado. Verifique os logs da função.");
    }
});


/**
 * Função para criar usuário com dados (Versão 2).
 * Como a lógica específica não foi fornecida, esta função foi implementada
 * com base na lógica de 'criarNovoProfissional'. Ela cria um usuário na
 * autenticação e salva os mesmos dados na coleção 'usuarios'.
 * **Revise e ajuste se a sua necessidade for diferente.**
 */
exports.criarUsuarioComDados = onCall(async (request) => {
    // 1. Verificação de Segurança
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Você precisa estar autenticado para realizar esta operação.");
    }
    
    const adminUid = request.auth.uid;

    try {
        // 2. Verificação de Permissão (igual à outra função, para consistência)
        const adminUserDoc = await db.collection("usuarios").doc(adminUid).get();
        if (!adminUserDoc.exists) {
            throw new HttpsError("permission-denied", "Usuário administrador não encontrado no banco de dados.");
        }

        const adminFuncoes = adminUserDoc.data().funcoes || [];
        if (!adminFuncoes.includes("admin") && !adminFuncoes.includes("financeiro")) {
            throw new HttpsError("permission-denied", "Você não tem permissão para criar novos usuários.");
        }

        const data = request.data;
        const senhaPadrao = "eupsico@2025"; // Senha padrão

        // 3. Criação do usuário na Autenticação
        const userRecord = await admin.auth().createUser({
            email: data.email,
            password: senhaPadrao,
            displayName: data.nome,
            disabled: false,
        });
        
        const uid = userRecord.uid;

        // 4. Preparação dos dados para o Firestore
        // **SE OS DADOS FOREM DIFERENTES, AJUSTE ESTE OBJETO**
        const dadosParaSalvar = {
            nome: data.nome,
            username: data.username,
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

        // 5. Salvamento no Firestore
        // **SE A COLEÇÃO FOR DIFERENTE, AJUSTE A LINHA ABAIXO**
        await db.collection("usuarios").doc(uid).set(dadosParaSalvar);

        // 6. Retorno de sucesso
        return { 
            status: "success", 
            message: "Operação 'criarUsuarioComDados' realizada com sucesso!" 
        };

    } catch (error) {
        // 7. Tratamento de Erros
        console.error("Erro em criarUsuarioComDados:", error);
        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError('already-exists', 'O e-mail fornecido já está em uso.');
        }
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", "Ocorreu um erro em 'criarUsuarioComDados'.");
    }
});
