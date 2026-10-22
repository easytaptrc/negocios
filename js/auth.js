// Acceso con usuario y contraseña, configuración inicial del primer administrador y barra superior compartida.
import {
  auth, db, toEmail, displayUser, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  createUserWithEmailAndPassword, updatePassword, reauthenticateWithCredential, EmailAuthProvider,
  doc, getDoc, setDoc, writeBatch, serverTimestamp
} from "./firebase.js";
import { esc, icon, openModal, toast } from "./ui.js";

export const DEFAULT_ORG = { name: "Grupo Nexus", tagline: "Portal Interno", logo: "" };

const ERRORS = {
  "auth/invalid-credential": "Usuario o contraseña incorrectos.",
  "auth/wrong-password": "Usuario o contraseña incorrectos.",
  "auth/user-not-found": "Usuario o contraseña incorrectos.",
  "auth/invalid-login-credentials": "Usuario o contraseña incorrectos.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth/network-request-failed": "Sin conexión. Revisa tu internet.",
  "auth/email-already-in-use": "Ese usuario ya existe.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-email": "Usuario o correo no válido (usa letras, números, punto o guion).",
  "auth/operation-not-allowed": "Activa el acceso con Correo/Contraseña en Firebase → Authentication.",
  "auth/configuration-not-found": "Activa Firebase Authentication (Correo/Contraseña) en la consola de Firebase.",
  "auth/requires-recent-login": "Por seguridad vuelve a iniciar sesión e inténtalo de nuevo.",
  "permission-denied": "Sin permisos. Revisa que las reglas de Firestore estén publicadas."
};

export function errMsg(e) {
  return ERRORS[e?.code] || e?.message || "Ocurrió un error inesperado.";
}

export async function loadOrg() {
  try {
    const s = await getDoc(doc(db, "org", "main"));
    return { ...DEFAULT_ORG, ...(s.exists() ? s.data() : {}) };
  } catch {
    return { ...DEFAULT_ORG };
  }
}

export function brandHtml(org) {
  const words = String(org.name || DEFAULT_ORG.name).trim().split(/\s+/);
  const last = words.length > 1 ? words.pop() : "";
  const mark = org.logo
    ? `<img src="${esc(org.logo)}" alt="">`
    : `<svg viewBox="0 0 32 32"><path d="M3 5h26L16 29z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M10 10h12l-6 11z" fill="currentColor"/></svg>`;
  return `<span class="brand-mark">${mark}</span>
    <span class="brand-name">${esc(words.join(" "))} ${last ? `<b>${esc(last)}</b>` : ""}</span>`;
}

// ---------- Pantalla de acceso ----------
let gate;
function ensureGate() {
  if (gate) return gate;
  gate = document.createElement("div");
  gate.className = "gate";
  document.body.appendChild(gate);
  return gate;
}

function showGate(html) {
  const g = ensureGate();
  g.hidden = false;
  g.innerHTML = `<div class="gate-glow"></div><div class="gate-card">${html}</div>`;
  return g;
}

function hideGate() {
  if (gate) gate.hidden = true;
}

function passwordField(id, label, autocomplete) {
  return `<label class="field"><span>${label}</span>
    <div class="pw-wrap"><input id="${id}" type="password" required minlength="6" autocomplete="${autocomplete}">
    <button type="button" class="pw-eye" data-eye="${id}" aria-label="Mostrar contraseña">${icon("eye")}</button></div></label>`;
}

function wireEyes(root) {
  root.querySelectorAll("[data-eye]").forEach((b) => b.addEventListener("click", () => {
    const inp = root.querySelector("#" + b.dataset.eye);
    const show = inp.type === "password";
    inp.type = show ? "text" : "password";
    b.innerHTML = icon(show ? "eyeOff" : "eye");
  }));
}

async function renderLogin(org, title) {
  let needsSetup = false, rulesWarning = false;
  try {
    needsSetup = !(await getDoc(doc(db, "meta", "setup"))).exists();
  } catch (e) {
    rulesWarning = true;
  }
  if (needsSetup) return renderSetup(org);

  const g = showGate(`
    <div class="gate-brand">${brandHtml(org)}</div>
    <p class="gate-sub">${esc(title || org.tagline)}</p>
    <form class="gate-form" id="login-form" autocomplete="on">
      <label class="field"><span>Usuario</span>
        <input id="lg-user" type="text" required autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="tu usuario o correo"></label>
      ${passwordField("lg-pass", "Contraseña", "current-password")}
      <p class="form-error" id="lg-err" ${rulesWarning ? "" : "hidden"}>${rulesWarning ? "No se pudo conectar con la base de datos. Revisa que Firestore esté creado y las reglas publicadas." : ""}</p>
      <button class="btn btn-gold btn-block" type="submit">${icon("lock")} Entrar</button>
    </form>
    <p class="gate-foot">${icon("lock")} Acceso protegido</p>`);
  wireEyes(g);
  const form = g.querySelector("#login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = g.querySelector("#lg-err");
    const btn = form.querySelector("button[type=submit]");
    err.hidden = true; btn.disabled = true; btn.classList.add("loading");
    try {
      await signInWithEmailAndPassword(auth, toEmail(g.querySelector("#lg-user").value), g.querySelector("#lg-pass").value);
    } catch (ex) {
      err.textContent = errMsg(ex); err.hidden = false;
      btn.disabled = false; btn.classList.remove("loading");
    }
  });
}

let settingUp = false;
function renderSetup(org) {
  const g = showGate(`
    <div class="gate-brand">${brandHtml(org)}</div>
    <h2 class="gate-title">Configuración inicial</h2>
    <p class="gate-sub">Crea la cuenta del <b>administrador principal</b>. Este paso solo aparece una vez.</p>
    <form class="gate-form" id="setup-form">
      <label class="field"><span>Nombre</span><input id="su-name" required placeholder="Ej. Andrés"></label>
      <label class="field"><span>Usuario o correo</span>
        <input id="su-user" required autocapitalize="none" spellcheck="false" autocomplete="username" placeholder="Ej. andres"></label>
      ${passwordField("su-pass", "Contraseña", "new-password")}
      ${passwordField("su-pass2", "Confirmar contraseña", "new-password")}
      <p class="form-error" id="su-err" hidden></p>
      <button class="btn btn-gold btn-block" type="submit">Crear administrador</button>
    </form>`);
  wireEyes(g);
  const form = g.querySelector("#setup-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = g.querySelector("#su-err");
    const btn = form.querySelector("button[type=submit]");
    const name = g.querySelector("#su-name").value.trim();
    const email = toEmail(g.querySelector("#su-user").value);
    const pass = g.querySelector("#su-pass").value;
    err.hidden = true;
    if (pass !== g.querySelector("#su-pass2").value) { err.textContent = "Las contraseñas no coinciden."; err.hidden = false; return; }
    btn.disabled = true; btn.classList.add("loading");
    settingUp = true;
    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = cred.user.uid;
      const batch = writeBatch(db);
      batch.set(doc(db, "users", uid), {
        name, email, username: displayUser(email), role: "admin",
        allBusinesses: true, businesses: [], active: true, createdAt: serverTimestamp()
      });
      batch.set(doc(db, "meta", "setup"), { adminUid: uid, createdAt: serverTimestamp() });
      await batch.commit();
      await setDoc(doc(db, "org", "main"), { ...DEFAULT_ORG, ...org, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      settingUp = false;
      location.href = "admin.html";
    } catch (ex) {
      settingUp = false;
      // Si falló la base de datos, borramos la cuenta recién creada para poder reintentar.
      if (cred?.user) await cred.user.delete().catch(() => {});
      err.textContent = errMsg(ex); err.hidden = false;
      btn.disabled = false; btn.classList.remove("loading");
    }
  });
}

function renderBlocked(org, message, { portalLink = false } = {}) {
  const g = showGate(`
    <div class="gate-brand">${brandHtml(org)}</div>
    <p class="gate-msg">${esc(message)}</p>
    <div class="gate-actions">
      ${portalLink ? `<a class="btn btn-gold" href="index.html">Ir al portal</a>` : ""}
      <button class="btn btn-ghost" id="gate-out">${icon("logout")} Cerrar sesión</button>
    </div>`);
  g.querySelector("#gate-out").addEventListener("click", () => signOut(auth));
}

/**
 * Protege una página: muestra el acceso hasta que haya una sesión válida.
 * Resuelve con { user, profile, org } cuando el usuario puede ver la página.
 */
export function requireAuth({ admin = false, title = "" } = {}) {
  showGate(`<div class="loader"></div>`);
  return new Promise((resolve) => {
    let resolved = false;
    let orgPromise = loadOrg();
    onAuthStateChanged(auth, async (user) => {
      if (settingUp) return;
      if (resolved) { location.reload(); return; }
      const org = await orgPromise;
      if (!user) return renderLogin(org, title);
      showGate(`<div class="loader"></div>`);
      let profile;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        profile = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      } catch (e) {
        return renderBlocked(org, errMsg(e));
      }
      if (!profile) return renderBlocked(org, "Tu cuenta no tiene un perfil asignado. Pide acceso al administrador.");
      if (profile.active === false) return renderBlocked(org, "Tu cuenta está desactivada. Contacta al administrador.");
      if (admin && profile.role !== "admin") return renderBlocked(org, "Esta sección es solo para administradores.", { portalLink: true });
      orgPromise = loadOrg(); // ya con sesión, por si cambió
      const fullOrg = await orgPromise;
      resolved = true;
      hideGate();
      resolve({ user, profile, org: fullOrg });
    });
  });
}

// ---------- Barra superior ----------
export function renderTopbar(el, { org, profile, user, active = "inicio" }) {
  const isAdmin = profile.role === "admin";
  el.innerHTML = `
    <a class="brand" href="index.html">${brandHtml(org)}</a>
    <span class="brand-tag">${esc(org.tagline || "")}</span>
    <nav class="nav">
      <a href="index.html" class="${active === "inicio" ? "on" : ""}">${icon("home")}<span>Inicio</span></a>
      ${isAdmin ? `<a href="admin.html" class="${active === "admin" ? "on" : ""}">${icon("settings")}<span>Admin</span></a>` : ""}
    </nav>
    <div class="user-menu">
      <button class="user-btn" aria-haspopup="true">${icon("user")}<span class="user-name">${esc(profile.name || displayUser(user.email))}</span></button>
      <div class="user-drop" hidden>
        <div class="user-info"><b>${esc(profile.name || "")}</b><small>@${esc(displayUser(user.email))} · ${isAdmin ? "Administrador" : "Usuario"}</small></div>
        <button data-act="pass">${icon("key")} Cambiar contraseña</button>
        <button data-act="out">${icon("logout")} Cerrar sesión</button>
      </div>
    </div>`;
  const btn = el.querySelector(".user-btn");
  const drop = el.querySelector(".user-drop");
  btn.addEventListener("click", (e) => { e.stopPropagation(); drop.hidden = !drop.hidden; });
  document.addEventListener("click", (e) => { if (!drop.contains(e.target)) drop.hidden = true; });
  drop.querySelector('[data-act="out"]').addEventListener("click", () => signOut(auth));
  drop.querySelector('[data-act="pass"]').addEventListener("click", () => { drop.hidden = true; changePasswordModal(user); });
}

function changePasswordModal(user) {
  const m = openModal(`
    <div class="modal-head"><h3>Cambiar contraseña</h3><button class="x" data-close>×</button></div>
    <form id="cp-form" class="form-grid">
      ${passwordField("cp-old", "Contraseña actual", "current-password")}
      ${passwordField("cp-new", "Nueva contraseña", "new-password")}
      ${passwordField("cp-new2", "Confirmar nueva contraseña", "new-password")}
      <p class="form-error" id="cp-err" hidden></p>
      <div class="modal-foot"><button type="button" class="btn btn-ghost" data-close>Cancelar</button>
      <button class="btn btn-gold" type="submit">Guardar</button></div>
    </form>`);
  wireEyes(m.el);
  m.el.querySelector("#cp-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = m.el.querySelector("#cp-err");
    const nw = m.el.querySelector("#cp-new").value;
    if (nw !== m.el.querySelector("#cp-new2").value) { err.textContent = "Las contraseñas no coinciden."; err.hidden = false; return; }
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, m.el.querySelector("#cp-old").value));
      await updatePassword(user, nw);
      m.close();
      toast("Contraseña actualizada");
    } catch (ex) {
      err.textContent = errMsg(ex); err.hidden = false;
    }
  });
}
