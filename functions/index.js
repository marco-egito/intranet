const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.criarNovoProfissional = functions.https.onCall(async (data, context) => {
  // Verificação de Segurança (Autenticação)
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Você precisa estar autenticado para executar esta ação.");
  }
  
  // Verificação de Permissão (Role)
  const adminUserDoc = await db.collection("usuarios").doc(context.auth.uid).get();
  if (!adminUserDoc.exists) {
    throw new functions.https.HttpsError("permission-denied", "Seu usuário administrador não foi encontrado no sistema.");
  }
  const adminFuncoes = adminUserDoc.data().funcoes || [];
  if (!adminFuncoes.includes("admin") && !adminFuncoes.includes("financeiro")) {
    throw new functions.https.HttpsError("permission-denied", "Você não tem permissão para criar novos profissionais.");
  }

  // --- INÍCIO DA CORREÇÃO: VALIDAÇÃO DOS DADOS DE ENTRADA ---
  // Verifica se os campos obrigatórios foram enviados pelo front-end
  if (!data.nome || !data.email || !data.contato || !data.profissao) {
    // Se algum campo estiver faltando, retorna um erro claro.
    // Isso evita o "ERRO: INTERNAL" genérico.
    throw new functions.https.HttpsError(
      "invalid-argument", 
      "Dados incompletos. Os campos Nome, E-mail, Telefone e Profissão são obrigatórios."
    );
  }
  // --- FIM DA CORREÇÃO ---

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
    console.error("Erro detalhado ao criar usuário na Autenticação:", error);
    // Retorna uma mensagem de erro mais específica para o usuário
    if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError("already-exists", "O e-mail fornecido já está em uso por outro usuário.");
    }
    throw new functions.https.HttpsError("internal", "Falha na criação do usuário no serviço de autenticação.");
  }

  // 2. Prepara os dados para salvar no Firestore
  const uid = userRecord.uid;
  const dadosParaSalvar = {
    nome: data.nome,
    username: data.username || "", // Garante que não seja undefined
    email: data.email,
    contato: data.contato,
    profissao: data.profissao,
    // Garante que 'funcoes' seja sempre um array para evitar erros
    funcoes: data.funcoes || [], 
    inativo: data.inativo || false,
    recebeDireto: data.recebeDireto || false,
    primeiraFase: data.primeiraFase || false,
    fazAtendimento: data.fazAtendimento || false,
    uid: uid,
  };

  // 3. Salva o documento no Firestore
  try {
    await db.collection("usuarios").doc(uid).set(dadosParaSalvar);
  } catch (error) {
    console.error("Erro ao salvar dados no Firestore:", error);
    // Se a escrita no banco de dados falhar, DESFAZ a criação do usuário na autenticação
    await admin.auth().deleteUser(uid);
    throw new functions.https.HttpsError("internal", "Falha ao salvar os dados no banco de dados. A criação do usuário foi revertida.");
  }

  return { status: "success", message: `Profissional ${data.nome} criado com sucesso!` };
});
