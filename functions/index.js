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

// O restante do arquivo (exports.criarNovoProfissional, etc.) permanece o mesmo,
// ele apenas chamará a função de depuração acima.
exports.criarNovoProfissional = onCall(async (request) => { /* ...código inalterado... */ });
exports.criarUsuarioComDados = onCall(async (request) => { /* ...código inalterado... */ });
