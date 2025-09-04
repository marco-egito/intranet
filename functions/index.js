const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.criarNovoProfissional = functions.https.onCall(async (data, context) => {
  // Verificação de Segurança
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

  // --- INÍCIO: VALIDAÇÃO DOS DADOS DE ENTRADA ---
  if (!data.nome || !data.email || !data.contato || !data.profissao) {
    throw new functions.https.HttpsError("invalid-argument", "Os campos Nome, E-mail, Telefone e Profissão são obrigatórios.");
  }
  // --- FIM: VALIDAÇÃO DOS DADOS DE ENTRADA ---

  // Define uma senha padrão segura
  const senhaPadrao = "eupsico@2025"; 

  // 1. Cria o usuário no Firebase Authentication
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email: data.email,
      password: senhaPadrao,
      displayName: data.nome,
      disabled: false,
    });
  } catch (error) {
    console.error("Erro ao criar usuário na Autenticação:", error);
    if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError("already-exists", "O e-mail fornecido já está em uso por outro usuário.");
    }
    throw new functions.https.HttpsError("internal", "Não foi possível criar o usuário na autenticação.");
  }

  // 2. Salva o documento no Firestore
  const uid = userRecord.uid;
  const dadosParaSalvar = {
    nome: data.nome,
    username: data.username,
    email: data.email,
    contato: data.contato,
    profissao: data.profissao,
    funcoes: data.funcoes || [], // Garante que funcoes seja um array
    inativo: data.inativo || false,
    recebeDireto: data.recebeDireto || false,
    primeiraFase: data.primeiraFase || false,
    fazAtendimento: data.fazAtendimento || false,
    uid: uid,
  };

  try {
    await db.collection("usuarios").doc(uid).set(dadosParaSalvar);
  } catch (error) {
    console.error("Erro ao salvar dados no Firestore:", error);
    // Desfaz a criação do usuário se o DB falhar
    await admin.auth().deleteUser(uid); 
    throw new functions.https.HttpsError("internal", "Falha ao salvar dados no Firestore. O usuário da autenticação foi removido.");
  }

  return { status: "success", message: `Usuário ${data.nome} criado com sucesso!` };
});
