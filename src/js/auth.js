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
    // Adiciona as views (divs) iniciais ao appContainer
    appContainer.innerHTML = `
        <div id="loading-view" class="view visible">
            <p>Verificando autenticação...</p>
        </div>
        <div id="login-view" class="view content-box"></div>
        <div id="dashboard-view" class="view"></div>
    `;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (userDoc.exists() && userDoc.data().funcoes?.length > 0) {
                const funcoes = userDoc.data().funcoes;
                loadDashboard(document.getElementById('dashboard-view'), user, funcoes);
                showView('dashboard-view');
            } else {
                renderLogin(document.getElementById('login-view'), "Acesso Negado. Contate o administrador.");
                showView('login-view');
                signOut(auth);
            }
        } else {
            renderLogin(document.getElementById('login-view'));
            showView('login-view');
        }
    });
}

function renderLogin(loginViewElement, message = "Por favor, faça login para continuar.") {
    loginViewElement.innerHTML = `
        <img src="https://i.ibb.co/JwdDSZx/Cabe-a-ho.png" alt="Logo EuPsico" style="max-width: 300px;">
        <h2>Intranet EuPsico</h2>
        <p>${message}</p>
        <button id="login-button">Login com Google</button>
    `;
    document.getElementById('login-button').addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).catch(error => console.error(error));
    });
}

// Função auxiliar para mostrar views, movida para cá
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('visible'));
    document.getElementById(viewId).classList.add('visible');
}