// Panel de administración: negocios, usuarios, solicitudes de cambio y datos de la organización.
import { requireAuth, renderTopbar, errMsg, DEFAULT_ORG } from "./auth.js";
import {
  db, firebaseConfig, toEmail, displayUser, isRealEmail, initializeApp, deleteApp, initializeAuth,
  inMemoryPersistence, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, auth,
  doc, getDocs, setDoc, updateDoc, deleteDoc, collection, serverTimestamp
} from "./firebase.js";
import { sortBusinesses } from "./business-view.js";
import {
  $, $$, esc, icon, toast, openModal, confirmDialog, resizeImage, fmtDate, logoHtml, statusBadge, REQUEST_STATUS
} from "./ui.js";

const { user, profile, org: initialOrg } = await requireAuth({ admin: true, title: "Panel de administración" });
let org = initialOrg;
const state = { businesses: [], users: [], requests: [] };
let reqFilter = "pendiente";
let reqBiz = "";

const SECTIONS = [
  ["resumen", "Resumen", "chart"],
  ["negocios", "Negocios", "grid"],
  ["usuarios", "Usuarios", "users"],
  ["solicitudes", "Solicitudes", "inbox"],
  ["organizacion", "Organización", "settings"]
];

// Negocios iniciales con los logos incluidos en assets/logos.
const SEED = [
  { id: "delta", name: "DELTA", color: "#d4a24c", logo: "assets/logos/delta.png" },
  { id: "santo-taco", name: "SANTO TACO", color: "#e53935", logo: "assets/logos/santo-taco.png" },
  { id: "fiza", name: "FIZA", color: "#1e88e5", logo: "assets/logos/fiza.png" },
  { id: "rival-gym", name: "RIVAL GYM", color: "#ef233c", logo: "assets/logos/rival-gym.png" },
  { id: "autolavado", name: "AUTOLAVADO", color: "#29b6f6", logo: "assets/logos/autolavado.png" }
];

const topbar = $("#topbar");
function paintTopbar() {
  renderTopbar(topbar, { org, profile, user, active: "admin" });
  document.title = `Administración · ${org.name}`;
}
paintTopbar();
topbar.hidden = false;
$("#app").hidden = false;

$("#side").innerHTML = SECTIONS.map(([key, label, ic]) =>
  `<a href="#${key}" data-sec="${key}">${icon(ic)}<span>${label}</span>${key === "solicitudes" ? '<em class="badge" id="pend-badge" hidden></em>' : ""}</a>`
).join("") + `<a href="index.html" class="side-portal">${icon("home")}<span>Ver portal</span></a>`;

$("#main").innerHTML = `<div class="loader center"></div>`;
try {
  await loadAll();
} catch (e) {
  $("#main").innerHTML = `<div class="empty"><h3>No se pudo cargar la información</h3><p>${esc(errMsg(e))}</p></div>`;
  throw e;
}
window.addEventListener("hashchange", route);
route();

// ---------- Datos ----------
async function loadAll() {
  await Promise.all([loadBusinesses(), loadUsers(), loadRequests()]);
}
async function loadBusinesses() {
  const s = await getDocs(collection(db, "businesses"));
  state.businesses = sortBusinesses(s.docs.map((d) => ({ id: d.id, ...d.data() })));
}
async function loadUsers() {
  const s = await getDocs(collection(db, "users"));
  state.users = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.name).localeCompare(String(b.name)));
}
async function loadRequests() {
  const s = await getDocs(collection(db, "requests"));
  state.requests = s.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const n = state.requests.filter((r) => r.status === "pendiente").length;
  const badge = $("#pend-badge");
  if (badge) { badge.hidden = !n; badge.textContent = n; }
}
function bizById(id) {
  return state.businesses.find((b) => b.id === id);
}

// ---------- Rutas ----------
function route() {
  const [sec, action, id] = location.hash.slice(1).split("/").map(decodeURIComponent);
  const key = SECTIONS.some(([k]) => k === sec) ? sec : "resumen";
  $$("#side [data-sec]").forEach((a) => a.classList.toggle("on", a.dataset.sec === key));
  const main = $("#main");
  if (key === "negocios" && action === "nuevo") viewBizForm(main, null);
  else if (key === "negocios" && action === "editar") viewBizForm(main, id);
  else ({ resumen: viewResumen, negocios: viewNegocios, usuarios: viewUsuarios, solicitudes: viewSolicitudes, organizacion: viewOrg })[key](main);
  window.scrollTo({ top: 0 });
}

function head(title, sub = "", actions = "", back = "") {
  return `<div class="admin-head"><div>${back}<h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ""}</div>
    ${actions ? `<div class="head-actions">${actions}</div>` : ""}</div>`;
}

function field(id, label, value = "", attrs = "") {
  return `<label class="field"><span>${label}</span><input id="${id}" value="${esc(value)}" ${attrs}></label>`;
}

// ---------- Resumen ----------
function viewResumen(main) {
  const pend = state.requests.filter((r) => r.status === "pendiente");
  const proc = state.requests.filter((r) => r.status === "proceso");
  const active = state.businesses.filter((b) => b.active !== false).length;
  const stat = (label, value, sub, ic, href) =>
    `<a class="stat" href="${href}"><span class="stat-ic">${icon(ic)}</span><span class="stat-val">${value}</span><span class="stat-label">${label}</span><span class="muted small">${sub}</span></a>`;
  main.innerHTML = `
    ${head(`Hola, ${esc(profile.name || "admin")}`, `Resumen de ${esc(org.name)}`,
      `<a class="btn btn-ghost" href="index.html">${icon("home")} Ver portal</a><a class="btn btn-gold" href="#negocios/nuevo">${icon("plus")} Nuevo negocio</a>`)}
    <div class="stats">
      ${stat("Negocios", state.businesses.length, `${active} visibles en el portal`, "grid", "#negocios")}
      ${stat("Usuarios", state.users.length, `${state.users.filter((u) => u.role === "admin").length} administradores`, "users", "#usuarios")}
      ${stat("Pendientes", pend.length, "solicitudes por revisar", "inbox", "#solicitudes")}
      ${stat("En proceso", proc.length, "solicitudes en curso", "edit", "#solicitudes")}
    </div>
    <h3 class="section-title">${icon("inbox")} Últimas solicitudes pendientes</h3>
    ${pend.length ? `<div class="req-list">${pend.slice(0, 5).map((r) => {
      const b = bizById(r.businessId);
      return `<a class="req req-link" href="#solicitudes" style="--accent:${esc(b?.color || "#d4a24c")}">
        <div class="req-top"><span class="mini-logo">${logoHtml(b || { name: r.businessName })}</span><b>${esc(r.businessName)}</b>
        <span class="req-type muted">· ${esc(r.type)}</span><span class="req-date">${fmtDate(r.createdAt)}</span></div>
        <p class="req-msg clamp">${esc(r.message)}</p></a>`;
    }).join("")}</div>` : `<p class="muted">Todo al día: no hay solicitudes pendientes.</p>`}
    <h3 class="section-title">${icon("grid")} Negocios</h3>
    <div class="mini-biz">${state.businesses.map((b) => `
      <a class="mini-biz-item" href="#negocios/editar/${encodeURIComponent(b.id)}" style="--accent:${esc(b.color || "#d4a24c")}">
        <span class="tab-logo">${logoHtml(b)}</span><span>${esc(b.name)}</span></a>`).join("") || `<p class="muted">Sin negocios todavía.</p>`}
    </div>`;
}

// ---------- Negocios ----------
function viewNegocios(main) {
  const list = state.businesses;
  main.innerHTML = `
    ${head("Negocios", `${list.length} registrados`, `<a class="btn btn-gold" href="#negocios/nuevo">${icon("plus")} Nuevo negocio</a>`)}
    ${list.length ? "" : `<div class="card seed-card">
      <div class="seed-logos">${SEED.map((s) => `<img src="${s.logo}" alt="${s.name}">`).join("")}</div>
      <div><h3>Carga tus 5 negocios</h3><p class="muted">Crea DELTA, SANTO TACO, FIZA, RIVAL GYM y AUTOLAVADO con sus logos. Después podrás editar todos sus datos.</p>
      <button class="btn btn-gold" id="seed">${icon("plus")} Cargar negocios iniciales</button></div></div>`}
    <div class="biz-grid">${list.map((b) => {
      const pend = state.requests.filter((r) => r.businessId === b.id && r.status === "pendiente").length;
      const links = ["facebook", "instagram", "whatsapp", "website"].filter((k) => b[k]).length;
      return `<div class="biz-card" style="--accent:${esc(b.color || "#d4a24c")}">
        <a class="biz-card-logo" href="#negocios/editar/${encodeURIComponent(b.id)}">${logoHtml(b)}</a>
        <div class="biz-card-body">
          <h4>${esc(b.name)}</h4>
          <div class="chips">
            ${b.active === false ? '<span class="chip chip-off">Oculto</span>' : '<span class="chip chip-on">Visible</span>'}
            <span class="chip">${links}/4 enlaces</span>
            ${pend ? `<span class="chip chip-warn">${pend} pendiente${pend > 1 ? "s" : ""}</span>` : ""}
          </div>
        </div>
        <div class="biz-card-actions">
          <a class="btn btn-sm" href="#negocios/editar/${encodeURIComponent(b.id)}">${icon("edit")} Editar</a>
          <a class="icon-btn" href="negocio.html?id=${encodeURIComponent(b.id)}" target="_blank" title="Ver panel">${icon("external")}</a>
          <button class="icon-btn danger" data-del="${esc(b.id)}" title="Eliminar">${icon("trash")}</button>
        </div>
      </div>`;
    }).join("")}</div>`;

  $("#seed")?.addEventListener("click", async (e) => {
    e.target.disabled = true;
    try {
      await Promise.all(SEED.map((s, i) => setDoc(doc(db, "businesses", s.id), {
        name: s.name, color: s.color, logo: s.logo, order: i + 1, active: true, description: "",
        proposals: [], extras: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      })));
      await loadBusinesses();
      toast("Negocios creados");
      viewNegocios(main);
    } catch (ex) { toast(errMsg(ex), "err"); e.target.disabled = false; }
  });
  $$("[data-del]", main).forEach((btn) => btn.addEventListener("click", async () => {
    const b = bizById(btn.dataset.del);
    if (!(await confirmDialog(`¿Eliminar "${b.name}"? Se borrarán todos sus datos. Esta acción no se puede deshacer.`, { okText: "Eliminar", danger: true }))) return;
    try {
      await deleteDoc(doc(db, "businesses", b.id));
      await loadBusinesses();
      toast("Negocio eliminado");
      viewNegocios(main);
    } catch (ex) { toast(errMsg(ex), "err"); }
  }));
}

function slugify(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "negocio";
}
function uniqueId(name) {
  const base = slugify(name);
  let id = base, n = 2;
  while (bizById(id)) id = `${base}-${n++}`;
  return id;
}

function propRow(p = {}) {
  return `<div class="dyn-row dyn-2"><input class="pp-title" placeholder="Título (ej. Propuesta comercial)" value="${esc(p.title)}">
    <input class="pp-url" placeholder="Enlace (Google Drive, PDF, Canva…)" value="${esc(p.url)}">
    <button type="button" class="icon-btn danger" data-rm title="Quitar">${icon("trash")}</button></div>`;
}
function extraRow(x = {}) {
  return `<div class="dyn-row dyn-3"><input class="ex-label" placeholder="Dato (ej. RFC)" value="${esc(x.label)}">
    <input class="ex-value" placeholder="Valor" value="${esc(x.value)}">
    <label class="check small"><input type="checkbox" class="ex-secret" ${x.secret ? "checked" : ""}> Oculto</label>
    <button type="button" class="icon-btn danger" data-rm title="Quitar">${icon("trash")}</button></div>`;
}

function viewBizForm(main, id) {
  const isNew = !id;
  const b = isNew
    ? { name: "", color: "#d4a24c", active: true, order: state.businesses.length + 1, proposals: [], extras: [] }
    : bizById(id);
  if (!b) { location.hash = "#negocios"; return; }
  let logo = b.logo || "";

  main.innerHTML = `
    ${head(isNew ? "Nuevo negocio" : `Editar ${esc(b.name)}`, "", isNew ? "" :
      `<a class="btn btn-ghost" href="negocio.html?id=${encodeURIComponent(id)}" target="_blank">${icon("external")} Ver panel</a>`,
      `<a class="back-link" href="#negocios">${icon("back")} Negocios</a>`)}
    <form id="bf" class="admin-form" novalidate>
      <section class="card"><h3>Identidad</h3>
        <div class="logo-edit">
          <div class="logo-preview" id="lp"></div>
          <div class="logo-actions">
            <label class="btn btn-sm">${icon("image")} Subir logo<input type="file" accept="image/*" id="logo-file" hidden></label>
            <button type="button" class="btn btn-sm btn-ghost" id="logo-clear">Quitar logo</button>
            <p class="muted small">PNG, JPG o WebP. Se ajusta automáticamente.</p>
          </div>
        </div>
        <div class="form-2">
          ${field("b-name", "Nombre *", b.name, 'required maxlength="60"')}
          <label class="field"><span>Color del negocio</span><input id="b-color" type="color" value="${esc(b.color || "#d4a24c")}"></label>
        </div>
        <label class="field"><span>Descripción</span><textarea id="b-desc" rows="3" maxlength="600" placeholder="A qué se dedica, horario, dirección…">${esc(b.description)}</textarea></label>
        <div class="form-2">
          ${field("b-order", "Orden en el portal", b.order ?? "", 'type="number" min="1" max="99"')}
          <label class="check toggle-line"><input type="checkbox" id="b-active" ${b.active !== false ? "checked" : ""}> Visible en el portal</label>
        </div>
      </section>
      <section class="card"><h3>Redes y contacto</h3>
        <div class="form-2">
          ${field("b-fb", "Facebook", b.facebook, 'placeholder="facebook.com/tu-pagina"')}
          ${field("b-ig", "Instagram", b.instagram, 'placeholder="@usuario o enlace"')}
          ${field("b-wa", "WhatsApp (con lada del país)", b.whatsapp, 'placeholder="52 55 1234 5678" inputmode="tel"')}
          ${field("b-web", "Sitio web", b.website, 'placeholder="www.ejemplo.com"')}
        </div>
      </section>
      <section class="card"><h3>Accesos</h3>
        <div class="form-2">
          ${field("b-email", "Correo", b.email, 'type="email" autocomplete="off"')}
          ${field("b-pass", "Contraseña", b.password, 'autocomplete="off" spellcheck="false"')}
        </div>
      </section>
      <section class="card"><h3>Cuenta bancaria</h3>
        <div class="form-2">
          ${field("b-bank", "Banco", b.bankName, 'placeholder="BBVA, Santander…"')}
          ${field("b-holder", "Titular", b.bankHolder)}
          ${field("b-account", "Número de cuenta", b.bankAccount, 'inputmode="numeric"')}
          ${field("b-clabe", "CLABE / IBAN", b.bankClabe, 'inputmode="numeric"')}
        </div>
      </section>
      <section class="card"><h3>Propuestas</h3>
        <div id="props" class="dyn-list">${(b.proposals || []).map(propRow).join("")}</div>
        <button type="button" class="btn btn-sm btn-ghost" id="add-prop">${icon("plus")} Agregar propuesta</button>
      </section>
      <section class="card"><h3>Datos adicionales</h3>
        <p class="muted small">Cualquier otro dato: RFC, dirección, TikTok, proveedor… Marca “Oculto” para que se muestre enmascarado.</p>
        <div id="extras" class="dyn-list">${(b.extras || []).map(extraRow).join("")}</div>
        <button type="button" class="btn btn-sm btn-ghost" id="add-extra">${icon("plus")} Agregar dato</button>
      </section>
      <p class="form-error" id="bf-err" hidden></p>
      <div class="form-bar"><a class="btn btn-ghost" href="#negocios">Cancelar</a>
        <button class="btn btn-gold" type="submit">Guardar negocio</button></div>
    </form>`;

  const paintLogo = () => {
    $("#lp").style.setProperty("--accent", $("#b-color").value);
    $("#lp").innerHTML = logoHtml({ name: $("#b-name").value || "?", logo, color: $("#b-color").value });
  };
  paintLogo();
  $("#b-color").addEventListener("input", paintLogo);
  $("#b-name").addEventListener("input", () => { if (!logo) paintLogo(); });
  $("#logo-file").addEventListener("change", async (e) => {
    try { logo = await resizeImage(e.target.files[0], 400); paintLogo(); }
    catch (ex) { toast(ex.message, "err"); }
    e.target.value = "";
  });
  $("#logo-clear").addEventListener("click", () => { logo = ""; paintLogo(); });
  $("#add-prop").addEventListener("click", () => $("#props").insertAdjacentHTML("beforeend", propRow()));
  $("#add-extra").addEventListener("click", () => $("#extras").insertAdjacentHTML("beforeend", extraRow()));
  main.querySelector("#bf").addEventListener("click", (e) => { const rm = e.target.closest("[data-rm]"); if (rm) rm.parentElement.remove(); });

  $("#bf").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#bf-err");
    const btn = e.target.querySelector("button[type=submit]");
    const name = $("#b-name").value.trim();
    err.hidden = true;
    if (!name) { err.textContent = "El nombre es obligatorio."; err.hidden = false; return; }
    const v = (sel) => $(sel).value.trim();
    const data = {
      name, description: v("#b-desc"), color: $("#b-color").value, order: Number($("#b-order").value) || 99,
      active: $("#b-active").checked, logo,
      facebook: v("#b-fb"), instagram: v("#b-ig"), whatsapp: v("#b-wa"), website: v("#b-web"),
      email: v("#b-email"), password: $("#b-pass").value,
      bankName: v("#b-bank"), bankHolder: v("#b-holder"), bankAccount: v("#b-account"), bankClabe: v("#b-clabe"),
      proposals: $$("#props .dyn-row").map((r) => ({ title: $(".pp-title", r).value.trim(), url: $(".pp-url", r).value.trim() }))
        .filter((p) => p.title || p.url),
      extras: $$("#extras .dyn-row").map((r) => ({ label: $(".ex-label", r).value.trim(), value: $(".ex-value", r).value.trim(), secret: $(".ex-secret", r).checked }))
        .filter((x) => x.label || x.value),
      updatedAt: serverTimestamp()
    };
    const bid = isNew ? uniqueId(name) : id;
    if (isNew) data.createdAt = serverTimestamp();
    btn.disabled = true; btn.classList.add("loading");
    try {
      await setDoc(doc(db, "businesses", bid), data, { merge: true });
      await loadBusinesses();
      toast(isNew ? "Negocio creado" : "Cambios guardados");
      location.hash = "#negocios";
    } catch (ex) {
      err.textContent = errMsg(ex); err.hidden = false;
      btn.disabled = false; btn.classList.remove("loading");
    }
  });
}

// ---------- Usuarios ----------
function accessLabel(u) {
  if (u.role === "admin") return "Todo (administrador)";
  if (u.allBusinesses) return "Todos los negocios";
  const names = (u.businesses || []).map((id) => bizById(id)?.name).filter(Boolean);
  return names.length ? names.join(", ") : "Ninguno";
}

function viewUsuarios(main) {
  main.innerHTML = `
    ${head("Usuarios", "Quién puede entrar y a qué negocios", `<button class="btn btn-gold" id="new-user">${icon("plus")} Nuevo usuario</button>`)}
    <div class="table-wrap"><table class="tbl">
      <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Acceso</th><th>Estado</th><th></th></tr></thead>
      <tbody>${state.users.map((u) => `<tr>
        <td><b>${esc(u.name)}</b>${u.id === user.uid ? ' <span class="chip">Tú</span>' : ""}</td>
        <td class="muted">${esc(displayUser(u.email))}</td>
        <td>${u.role === "admin" ? '<span class="chip chip-gold">Admin</span>' : '<span class="chip">Usuario</span>'}</td>
        <td class="small">${esc(accessLabel(u))}</td>
        <td>${u.active === false ? '<span class="chip chip-off">Desactivado</span>' : '<span class="chip chip-on">Activo</span>'}</td>
        <td class="row-actions"><button class="icon-btn" data-edit="${esc(u.id)}" title="Editar">${icon("edit")}</button>
          ${u.id !== user.uid ? `<button class="icon-btn danger" data-del="${esc(u.id)}" title="Quitar acceso">${icon("trash")}</button>` : ""}</td>
      </tr>`).join("")}</tbody></table></div>
    <p class="muted small note">Los usuarios pueden cambiar su propia contraseña desde su menú (arriba a la derecha).
      Si un usuario tiene correo real, puedes enviarle un correo para restablecerla.</p>`;
  $("#new-user").addEventListener("click", () => userModal(null));
  $$("[data-edit]", main).forEach((b) => b.addEventListener("click", () => userModal(state.users.find((u) => u.id === b.dataset.edit))));
  $$("[data-del]", main).forEach((b) => b.addEventListener("click", async () => {
    const u = state.users.find((x) => x.id === b.dataset.del);
    if (!(await confirmDialog(`¿Quitar el acceso de "${u.name}"? Ya no podrá entrar al portal.`, { okText: "Quitar acceso", danger: true }))) return;
    try {
      await deleteDoc(doc(db, "users", u.id));
      await loadUsers();
      toast("Acceso eliminado");
      viewUsuarios(main);
    } catch (ex) { toast(errMsg(ex), "err"); }
  }));
}

// Crea la cuenta en Firebase Auth con una app secundaria para no cerrar la sesión del administrador.
async function createAuthUser(email, password) {
  const sec = initializeApp(firebaseConfig, `alta-${Date.now()}`);
  try {
    const secAuth = initializeAuth(sec, { persistence: inMemoryPersistence });
    const cred = await createUserWithEmailAndPassword(secAuth, email, password);
    await signOut(secAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(sec).catch(() => {});
  }
}

function userModal(u) {
  const isNew = !u;
  const isSelf = u?.id === user.uid;
  const selected = new Set(u?.businesses || []);
  const all = !!u?.allBusinesses;
  const m = openModal(`
    <div class="modal-head"><h3>${isNew ? "Nuevo usuario" : `Editar ${esc(u.name)}`}</h3><button class="x" data-close>×</button></div>
    <form id="uf" class="form-grid" autocomplete="off">
      <div class="form-2">
        ${field("u-name", "Nombre", u?.name || "", "required")}
        ${field("u-user", "Usuario o correo", u ? displayUser(u.email) : "", `required autocapitalize="none" spellcheck="false" ${isNew ? "" : "disabled"}`)}
      </div>
      ${isNew ? field("u-pass", "Contraseña (mín. 6 caracteres)", "", 'required minlength="6" autocomplete="new-password"') : ""}
      <div class="form-2">
        <label class="field"><span>Rol</span><select id="u-role" ${isSelf ? "disabled" : ""}>
          <option value="user" ${u?.role !== "admin" ? "selected" : ""}>Usuario</option>
          <option value="admin" ${u?.role === "admin" ? "selected" : ""}>Administrador</option></select></label>
        ${isNew ? "" : `<label class="field"><span>Estado</span><select id="u-active" ${isSelf ? "disabled" : ""}>
          <option value="1" ${u.active !== false ? "selected" : ""}>Activo</option>
          <option value="0" ${u.active === false ? "selected" : ""}>Desactivado</option></select></label>`}
      </div>
      <fieldset class="access" id="u-access">
        <legend>Acceso a negocios</legend>
        <label class="check"><input type="radio" name="acc" value="all" ${all ? "checked" : ""}> Todos los negocios (incluye los nuevos)</label>
        <label class="check"><input type="radio" name="acc" value="some" ${all ? "" : "checked"}> Solo los seleccionados</label>
        <div class="acc-list">${state.businesses.map((b) => `
          <label class="acc-item" style="--accent:${esc(b.color || "#d4a24c")}"><input type="checkbox" value="${esc(b.id)}" ${selected.has(b.id) ? "checked" : ""}>
            <span class="tab-logo">${logoHtml(b)}</span><span>${esc(b.name)}</span></label>`).join("") || '<p class="muted small">Primero crea negocios.</p>'}</div>
      </fieldset>
      ${!isNew && isRealEmail(u.email) ? `<button type="button" class="btn btn-ghost btn-sm" id="u-reset">${icon("key")} Enviar correo para restablecer contraseña</button>` : ""}
      <p class="form-error" id="uf-err" hidden></p>
      <div class="modal-foot"><button type="button" class="btn btn-ghost" data-close>Cancelar</button>
        <button class="btn btn-gold" type="submit">${isNew ? "Crear usuario" : "Guardar"}</button></div>
    </form>`);
  const el = m.el;
  const syncAccess = () => {
    const isAdminRole = $("#u-role", el).value === "admin";
    $("#u-access", el).hidden = isAdminRole;
    $(".acc-list", el).classList.toggle("disabled", $('input[name="acc"]:checked', el).value === "all");
  };
  $("#u-role", el).addEventListener("change", syncAccess);
  $$('input[name="acc"]', el).forEach((r) => r.addEventListener("change", syncAccess));
  syncAccess();
  $("#u-reset", el)?.addEventListener("click", async () => {
    try { await sendPasswordResetEmail(auth, u.email); toast(`Correo enviado a ${u.email}`); }
    catch (ex) { toast(errMsg(ex), "err"); }
  });

  $("#uf", el).addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#uf-err", el);
    const btn = e.target.querySelector("button[type=submit]");
    const name = $("#u-name", el).value.trim();
    const role = $("#u-role", el).value;
    const allBusinesses = $('input[name="acc"]:checked', el).value === "all";
    const businesses = $$(".acc-list input:checked", el).map((c) => c.value);
    err.hidden = true;
    const fail = (msg) => { err.textContent = msg; err.hidden = false; btn.disabled = false; btn.classList.remove("loading"); };
    if (!name) return fail("Escribe el nombre.");
    btn.disabled = true; btn.classList.add("loading");
    try {
      if (isNew) {
        const raw = $("#u-user", el).value.trim().toLowerCase();
        if (!raw.includes("@") && !/^[a-z0-9._-]{3,30}$/.test(raw)) return fail("El usuario debe tener de 3 a 30 caracteres: letras, números, punto, guion o guion bajo.");
        const pass = $("#u-pass", el).value;
        if (pass.length < 6) return fail("La contraseña debe tener al menos 6 caracteres.");
        const email = toEmail(raw);
        const uid = await createAuthUser(email, pass);
        await setDoc(doc(db, "users", uid), {
          name, email, username: displayUser(email), role, allBusinesses, businesses,
          active: true, createdAt: serverTimestamp(), createdBy: user.uid
        });
        toast("Usuario creado");
      } else {
        const data = { name, allBusinesses, businesses, updatedAt: serverTimestamp() };
        if (!isSelf) { data.role = role; data.active = $("#u-active", el).value === "1"; }
        await updateDoc(doc(db, "users", u.id), data);
        toast("Usuario actualizado");
      }
      m.close();
      await loadUsers();
      viewUsuarios($("#main"));
    } catch (ex) {
      fail(ex.code === "auth/email-already-in-use"
        ? "Ese usuario ya existe en Firebase. Usa otro nombre de usuario (o bórralo en Firebase → Authentication)."
        : errMsg(ex));
    }
  });
}

// ---------- Solicitudes ----------
function viewSolicitudes(main) {
  const counts = Object.fromEntries(Object.keys(REQUEST_STATUS).map((k) => [k, state.requests.filter((r) => r.status === k).length]));
  const list = state.requests.filter((r) => (reqFilter === "todas" || r.status === reqFilter) && (!reqBiz || r.businessId === reqBiz));
  main.innerHTML = `
    ${head("Solicitudes de cambio", "Lo que los usuarios piden actualizar", `<button class="btn btn-ghost" id="rq-reload">Actualizar</button>`)}
    <div class="filters">
      <div class="seg">${[...Object.entries(REQUEST_STATUS).map(([k, s]) => [k, s.label, counts[k]]), ["todas", "Todas", state.requests.length]]
        .map(([k, label, c]) => `<button data-f="${k}" class="${reqFilter === k ? "on" : ""}">${label} <em>${c}</em></button>`).join("")}</div>
      <select id="rq-biz"><option value="">Todos los negocios</option>
        ${state.businesses.map((b) => `<option value="${esc(b.id)}" ${reqBiz === b.id ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select>
    </div>
    <div class="req-list">${list.map((r) => {
      const b = bizById(r.businessId);
      return `<div class="req req-admin" data-id="${esc(r.id)}" style="--accent:${esc(b?.color || "#d4a24c")}">
        <div class="req-top"><span class="mini-logo">${logoHtml(b || { name: r.businessName })}</span><b>${esc(r.businessName)}</b>
          ${statusBadge(r.status)}<span class="req-type">${esc(r.type)}</span><span class="req-date">${fmtDate(r.createdAt)}</span></div>
        <div class="muted small">De: ${esc(r.userName || "")} (${esc(displayUser(r.userEmail))})</div>
        <p class="req-msg">${esc(r.message)}</p>
        <div class="req-admin-row">
          <select data-st>${Object.entries(REQUEST_STATUS).map(([k, s]) => `<option value="${k}" ${r.status === k ? "selected" : ""}>${s.label}</option>`).join("")}</select>
          <input data-note placeholder="Respuesta para el usuario (opcional)" value="${esc(r.adminNote)}">
          <button class="btn btn-sm btn-gold" data-save>Guardar</button>
          ${b ? `<a class="btn btn-sm btn-ghost" href="#negocios/editar/${encodeURIComponent(b.id)}">${icon("edit")} Editar negocio</a>` : ""}
          <button class="icon-btn danger" data-del title="Eliminar">${icon("trash")}</button>
        </div>
      </div>`;
    }).join("") || `<p class="muted">No hay solicitudes en este filtro.</p>`}</div>`;

  $$("[data-f]", main).forEach((b) => b.addEventListener("click", () => { reqFilter = b.dataset.f; viewSolicitudes(main); }));
  $("#rq-biz").addEventListener("change", (e) => { reqBiz = e.target.value; viewSolicitudes(main); });
  $("#rq-reload").addEventListener("click", async () => { await loadRequests(); viewSolicitudes(main); toast("Solicitudes actualizadas"); });
  $$(".req-admin", main).forEach((card) => {
    const id = card.dataset.id;
    $("[data-save]", card).addEventListener("click", async () => {
      try {
        await updateDoc(doc(db, "requests", id), {
          status: $("[data-st]", card).value, adminNote: $("[data-note]", card).value.trim(),
          handledBy: user.uid, updatedAt: serverTimestamp()
        });
        await loadRequests();
        toast("Solicitud actualizada");
        viewSolicitudes(main);
      } catch (ex) { toast(errMsg(ex), "err"); }
    });
    $("[data-del]", card).addEventListener("click", async () => {
      if (!(await confirmDialog("¿Eliminar esta solicitud?", { okText: "Eliminar", danger: true }))) return;
      try {
        await deleteDoc(doc(db, "requests", id));
        await loadRequests();
        viewSolicitudes(main);
      } catch (ex) { toast(errMsg(ex), "err"); }
    });
  });
}

// ---------- Organización ----------
function viewOrg(main) {
  let logo = org.logo || "";
  main.innerHTML = `
    ${head("Organización", "Nombre y logo que aparecen en el portal")}
    <form id="of" class="admin-form">
      <section class="card"><h3>Identidad del grupo</h3>
        <div class="logo-edit">
          <div class="logo-preview round" id="olp"></div>
          <div class="logo-actions">
            <label class="btn btn-sm">${icon("image")} Subir logo<input type="file" accept="image/*" id="o-file" hidden></label>
            <button type="button" class="btn btn-sm btn-ghost" id="o-clear">Quitar logo</button>
            <p class="muted small">Sin logo se muestra el nombre en el centro de la órbita.</p>
          </div>
        </div>
        <div class="form-2">
          ${field("o-name", "Nombre", org.name, "required")}
          ${field("o-tag", "Subtítulo", org.tagline)}
        </div>
      </section>
      <div class="form-bar"><button class="btn btn-gold" type="submit">Guardar</button></div>
    </form>
    <section class="card"><h3>Respaldo</h3>
      <p class="muted small">Descarga una copia de negocios, usuarios y solicitudes en formato JSON.</p>
      <button class="btn btn-ghost" id="backup">${icon("doc")} Descargar respaldo</button>
    </section>`;
  const paint = () => {
    $("#olp").innerHTML = logo ? `<img src="${esc(logo)}" alt="">` : `<span class="logo-fallback">${esc(($("#o-name").value || "?").slice(0, 2).toUpperCase())}</span>`;
  };
  paint();
  $("#o-name").addEventListener("input", () => { if (!logo) paint(); });
  $("#o-file").addEventListener("change", async (e) => {
    try { logo = await resizeImage(e.target.files[0], 400); paint(); } catch (ex) { toast(ex.message, "err"); }
    e.target.value = "";
  });
  $("#o-clear").addEventListener("click", () => { logo = ""; paint(); });
  $("#of").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = { name: $("#o-name").value.trim() || DEFAULT_ORG.name, tagline: $("#o-tag").value.trim(), logo, updatedAt: serverTimestamp() };
    try {
      await setDoc(doc(db, "org", "main"), data, { merge: true });
      org = { ...org, ...data };
      paintTopbar();
      toast("Organización actualizada");
    } catch (ex) { toast(errMsg(ex), "err"); }
  });
  $("#backup").addEventListener("click", () => {
    const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v && typeof v.toDate === "function" ? v.toDate().toISOString() : v)));
    const blob = new Blob([JSON.stringify(strip({ exportedAt: new Date().toISOString(), org, ...state }), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `respaldo-${slugify(org.name)}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}
