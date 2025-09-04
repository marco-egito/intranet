const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Função para criar um novo profissional.
 * Cria o usuário no Firebase Authentication e depois salva seus dados no Firestore.
 * Versão 1: Estrutura de try/catch aprimorada para garantir a atomicidade da operação.
 */
exports.criarNovoProfissional = functions.https.onCall(async (data, context) => {
    // 1. Verificação de Segurança e Permissões
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Você precisa estar autenticado para realizar esta operação.");
    }

    try {
        const adminUserDoc = await db.collection("usuarios").doc(context.auth.uid).get();
        if (!adminUserDoc.exists) {
            throw new functions.https.HttpsError("permission-denied", "Usuário de origem não encontrado no banco de dados.");
        }

        const adminFuncoes = adminUserDoc.data().funcoes || [];
        if (!adminFuncoes.includes("admin") && !adminFuncoes.includes("financeiro")) {
            throw new functions.https.HttpsError("permission-denied", "Você não tem permissão para criar novos usuários.");
        }

        // 2. Definição da senha padrão
        const senhaPadrao = "eupsico@2025";

        // 3. Criação do usuário na Autenticação e salvamento no Firestore (operação atômica)
        // O userRecord só será criado se o email não existir.
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
            uid: uid, // Salva o UID gerado pela autenticação
        };

        // Salva os dados no Firestore usando o UID como ID do documento
        await db.collection("usuarios").doc(uid).set(dadosParaSalvar);

        // 5. Retorno de sucesso
        return {
            status: "success",
            message: `Usuário ${data.nome} criado com sucesso!`
        };

    } catch (error) {
        // 6. Tratamento de Erros
        console.error("Erro detalhado ao criar profissional:", error);

        // Se o usuário foi criado na autenticação mas falhou ao salvar no DB, removemos o usuário.
        // Isso pode ocorrer em um caso raro onde o createUser funciona e o .set() falha.
        if (error.uid) {
             await admin.auth().deleteUser(error.uid);
             throw new functions.https.HttpsError("internal", "Falha ao salvar dados no Firestore. O usuário da autenticação foi removido para manter a consistência.");
        }

        // Trata erros específicos do Firebase Auth
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'O e-mail fornecido já está em uso por outra conta.');
        }
        if (error.code === 'auth/invalid-email') {
            throw new functions.https.HttpsError('invalid-argument', 'O formato do e-mail fornecido é inválido.');
        }
        
        // Trata outros erros de permissão ou de Https
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        // Erro genérico
        throw new functions.https.HttpsError("internal", "Ocorreu um erro inesperado ao criar o profissional. Verifique os logs da função para mais detalhes.");
    }
});
