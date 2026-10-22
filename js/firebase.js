// Inicialización única de Firebase. Todas las páginas importan desde aquí.
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export {
  onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword,
  updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail,
  initializeAuth, inMemoryPersistence, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
export {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where,
  orderBy, writeBatch, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
export { initializeApp, deleteApp };

export const firebaseConfig = {
  apiKey: "AIzaSyAqfpn1xeZvLKEe-vpNhDQ0hEU5_rq-Kow",
  authDomain: "negocios-andres.firebaseapp.com",
  projectId: "negocios-andres",
  storageBucket: "negocios-andres.firebasestorage.app",
  messagingSenderId: "904450229870",
  appId: "1:904450229870:web:2390019947e6425ad9887f",
  measurementId: "G-0TSFQ3PH4R"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics es opcional: si el navegador no lo soporta (o un bloqueador lo impide) no pasa nada.
import("https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js")
  .then(async (m) => { if (await m.isSupported()) m.getAnalytics(app); })
  .catch(() => {});

// Los usuarios pueden entrar con un "usuario" simple o con un correo real.
// Un usuario sin "@" se guarda en Firebase Auth como usuario@USER_DOMAIN.
export const USER_DOMAIN = "negocios-andres.app";

export function toEmail(userOrEmail) {
  const v = String(userOrEmail || "").trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${USER_DOMAIN}`;
}

export function displayUser(email) {
  const v = String(email || "");
  return v.endsWith("@" + USER_DOMAIN) ? v.slice(0, -USER_DOMAIN.length - 1) : v;
}

export function isRealEmail(email) {
  return !!email && !String(email).endsWith("@" + USER_DOMAIN);
}

// Registro del service worker (app web instalable).
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
