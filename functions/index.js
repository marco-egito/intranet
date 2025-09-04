// functions/index.js (com senha padrão)
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.criarNovoProfissional = functions.https.onCall(async (data, context) => {
  // Verificações de segurança (sem alteração)
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Você precisa estar autenticado.");
  }
  const adminUserDoc = await db.collection("usuarios").doc(context.auth.uid).get();
  if (!adminUserDoc.exists) {
      throw new functions.https.HttpsError("permission-denied", "Usuário de origem não encontrado.");
  }
  const adminFuncoes = adminUserDoc.data().funcoes || [];
  if (!adminFuncoes.includes("admin") && !adminFuncoes.includes("financeiro")) {
    throw new functions.https.HttpsError("permission-denied", "Você não tem permissão para criar usuários.");
  }

  // --- ALTERAÇÃO PRINCIPAL AQUI ---
  // Define uma senha padrão para todos os novos usuários
  const senhaPadrao = "eupsico@2025"; // IMPORTANTE: Altere para uma senha segura que só você saiba

  // 1. Cria o usuário no Firebase Authentication usando a senha padrão
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email: data.email,
      password: senhaPadrao, // Usa a senha padrão
      displayName: data.nome,
      disabled: false,
    });
  } catch (error) {
    console.error("Erro ao criar usuário na Autenticação:", error);
    throw new functions.https.HttpsError("internal", "Não foi possível criar o usuário. O e-mail pode já estar em uso.");
  }

  // 2. Salva o documento no Firestore (sem alteração)
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
    await admin.auth().deleteUser(uid);
    throw new functions.https.HttpsError("internal", "Falha ao salvar dados no Firestore. O usuário da autenticação foi removido.");
  }

  // 3. Retorna sucesso
  return {
    status: "success",
    message: `Usuário ${data.nome} criado com sucesso com uma senha padrão!`,
  };
});
