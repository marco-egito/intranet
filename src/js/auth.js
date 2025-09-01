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
  storageBucket: "eupsico-agendamentos-d2048.firebasestorage.app",
  messagingSenderId: "1041518416343",
  appId: "1:1041518416343:web:3a0abc73404ccd51d7bb92"
};

// Inicializa o Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export function handleAuth(appContainer) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (userDoc.exists() && userDoc.data().funcoes?.length > 0) {
                const funcoes = userDoc.data().funcoes;
                // Usuário logado e com permissões, carrega o dashboard
                loadDashboard(appContainer, user, funcoes);
            } else {
                // Usuário sem permissões
                renderLogin(appContainer, "Acesso Negado. Contate o administrador.");
                signOut(auth);
            }
        } else {
            // Usuário não está logado
            renderLogin(appContainer);
        }
    });
}

function renderLogin(appContainer, message = "Por favor, faça login para continuar.") {
    appContainer.innerHTML = `
        <div style="text-align:center; margin-top: 50px;">
            <img src="https://i.ibb.co/JwdDSZx/Cabe-a-ho.png" alt="Logo EuPsico" style="max-width: 300px;">
            <h2>Intranet EuPsico</h2>
            <p>${message}</p>
            <button id="login-button">Login com Google</button>
        </div>
    `;
    document.getElementById('login-button').addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).catch(error => console.error(error));
    });
}