const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.criarNovoProfissional = functions.https.onCall(
    async (data, context) => {
        // 1. Verifica permissões do usuário autenticado
        const adminUserDoc = await
        db.collection("usuarios").doc(context.auth.uid).get();
        const adminFuncoes = adminUserDoc.data()?.funcoes || [];


        if (!adminFuncoes.includes("admin") &&
            !adminFuncoes.includes("financeiro")) {
            throw new functions.https.HttpsError(
                "permission-denied",
                "Você não tem permissão de administrador para criar novos " +
                "usuários.",
            );
        }

        // 2. Cria o usuário no Firebase Authentication
        let userRecord;
        try {
            userRecord = await admin.auth().createUser({
                email: data.email,
                password: data.senha,
                displayName: data.nome,
                disabled: false,
            });
        } catch (error) {
            console.error("Erro ao criar usuário na Autenticação:", error);
            throw new functions.https.HttpsError(
                "internal",
                "Não foi possível criar o usuário na autenticação. " +
                "O e-mail pode já estar em uso.",
            );
        }

        // 3. Salva os dados no Firestore
        const uid = userRecord.uid;
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

        try {
            await db.collection("usuarios").doc(uid).set(dadosParaSalvar);
        } catch (error) {
            console.error("Erro ao salvar dados no Firestore:", error);
            throw new functions.https.HttpsError(
                "Você não tem permissão de administrador para criar novos " +
                "usuários.",
            );
        }

        // 4. Retorna sucesso
        return {
            status: "success",
            message: `Usuário ${data.nome} criado com sucesso! UID: ${uid}`,
        };
    },
);
