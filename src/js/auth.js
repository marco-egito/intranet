// /src/js/auth.js
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { loadDashboard } from './dashboard.js';

const firebaseConfig = {
    apiKey: "AIzaSyCLeWW39nqxsdv1YD-CNa9RSTv05lGHJxM",
    authDomain: "eupsico-agendamentos-d2048.firebaseapp.com",
    databaseURL: "https://eupsico-agendamentos-d2048-default-rtdb.firebaseio.com",
    projectId: "eupsico-agendamentos-d2048",
    storageBucket: "eupsico-agendamentos-d2048.appspot.com",
    messagingSenderId: "1041518416343",
    appId: "1:1041518416343:web:3b972c212c52a59ad7bb92"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export function handleAuth(appContainer) {
    appContainer.innerHTML = `<p style="text-align:center; margin-top: 50px;">Verificando autenticação...</p>`;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Se o usuário estiver logado, busca as permissões
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (userDoc.exists() && userDoc.data().funcoes?.length > 0) {
                const funcoes = userDoc.data().funcoes;
                // Renderiza o dashboard se tiver permissões
                loadDashboard(appContainer, user, funcoes);
            } else {
                // Se não tiver permissões, mostra tela de acesso negado
                renderAccessDenied(appContainer);
                signOut(auth);
            }
        } else {
            // Se não estiver logado, renderiza a tela de login
            renderLogin(appContainer);
        }
    });
}

function renderLogin(appContainer, message = "Por favor, faça login para continuar.") {
    // Limpa o container e renderiza a tela de login completa
    appContainer.innerHTML = `
        <div id="login-view" class="content-box" style="text-align: center; max-width: 450px; margin: 50px auto;">
            <img src="/assets/logo-eupsico.png" alt="Logo EuPsico" style="max-width: 300px;">
            <h2>Intranet EuPsico</h2>
            <p>${message}</p>
            <button id="login-button">Login com Google</button>
        </div>
    `;
    document.getElementById('login-button').addEventListener('click', () => {
        appContainer.innerHTML = `<p style="text-align:center; margin-top: 50px;">Aguarde...</p>`;
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).catch(error => {
            console.error(error);
            renderLogin(appContainer, "Ocorreu um erro ao tentar fazer login.");
        });
    });
}

function renderAccessDenied(appContainer) {
    appContainer.innerHTML = `
        <div class="content-box" style="max-width: 800px; margin: 50px auto; text-align: center;">
            <h2>Acesso Negado</h2>
            <p>Você está autenticado, mas seu usuário não tem permissões definidas. Contate o administrador.</p>
            <button id="denied-logout">Sair</button>
        </div>
    `;
    document.getElementById('denied-logout').addEventListener('click', () => signOut(auth));
}