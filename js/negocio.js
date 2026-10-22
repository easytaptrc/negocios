// Panel independiente de un negocio: negocio.html?id=<id>
import { requireAuth, renderTopbar, errMsg } from "./auth.js";
import { renderBusinessDetail } from "./business-view.js";
import { db, doc, getDoc, getDocs, collection, query, where } from "./firebase.js";
import { $, esc, icon, fmtDate, statusBadge } from "./ui.js";

const id = new URLSearchParams(location.search).get("id") || "";
const { user, profile, org } = await requireAuth();
const isAdmin = profile.role === "admin";
const topbar = $("#topbar");
renderTopbar(topbar, { org, profile, user, active: "" });
topbar.hidden = false;
$("#app").hidden = false;
$("#back").innerHTML = `${icon("back")} Volver al portal`;
$("#back").href = `index.html#${encodeURIComponent(id)}`;

let biz = null;
try {
  const snap = id ? await getDoc(doc(db, "businesses", id)) : null;
  if (snap?.exists()) biz = { id: snap.id, ...snap.data() };
} catch (e) {
  // Sin permiso para este negocio: se trata igual que "no encontrado".
}
if (biz && biz.active === false && !isAdmin) biz = null;

if (!biz) {
  $("#detail").innerHTML = `<div class="empty"><h3>Negocio no disponible</h3><p>No existe o no tienes acceso a él.</p>
    <a class="btn btn-gold" href="index.html">Ir al portal</a></div>`;
  $("#req-title").hidden = true;
} else {
  document.title = `${biz.name} · ${org.name}`;
  document.documentElement.style.setProperty("--accent", biz.color || "#d4a24c");
  renderBusinessDetail($("#detail"), biz, { user, profile, onRequest: loadRequests });
  $("#req-title").innerHTML = `${icon("inbox")} ${isAdmin ? "Solicitudes de este negocio" : "Mis solicitudes"}`;
  loadRequests();
}

async function loadRequests() {
  const box = $("#requests");
  try {
    const col = collection(db, "requests");
    const q = isAdmin
      ? query(col, where("businessId", "==", id))
      : query(col, where("uid", "==", user.uid), where("businessId", "==", id));
    const snap = await getDocs(q);
    const reqs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    box.innerHTML = reqs.length ? reqs.map((r) => `
      <div class="req">
        <div class="req-top">${statusBadge(r.status)}<span class="req-type">${esc(r.type)}</span>
          ${isAdmin ? `<span class="muted small">· ${esc(r.userName || r.userEmail)}</span>` : ""}
          <span class="req-date">${fmtDate(r.createdAt)}</span></div>
        <p class="req-msg">${esc(r.message)}</p>
        ${r.adminNote ? `<p class="req-note"><b>Respuesta:</b> ${esc(r.adminNote)}</p>` : ""}
      </div>`).join("")
      : `<p class="muted">No hay solicitudes todavía. Usa “Solicitar un cambio” para pedir una actualización.</p>`;
  } catch (e) {
    box.innerHTML = `<p class="form-error">${esc(errMsg(e))}</p>`;
  }
}
