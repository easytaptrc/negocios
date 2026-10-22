// Vista de detalle de un negocio (usada por el portal y por el panel individual) y solicitudes de cambio.
import { db, doc, getDoc, getDocs, addDoc, collection, serverTimestamp } from "./firebase.js";
import {
  esc, icon, copyText, toast, openModal, facebookUrl, instagramUrl, whatsappUrl, normalizeUrl,
  logoHtml, REQUEST_TYPES
} from "./ui.js";
import { errMsg } from "./auth.js";

export function sortBusinesses(list) {
  return list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || String(a.name).localeCompare(String(b.name)));
}

// Admin o usuarios con acceso total leen la colección completa; el resto solo sus negocios asignados.
export async function loadBusinesses(profile) {
  let list;
  if (profile.role === "admin" || profile.allBusinesses) {
    const snap = await getDocs(collection(db, "businesses"));
    list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } else {
    const snaps = await Promise.all((profile.businesses || []).map((id) => getDoc(doc(db, "businesses", id)).catch(() => null)));
    list = snaps.filter((s) => s && s.exists()).map((s) => ({ id: s.id, ...s.data() }));
  }
  return sortBusinesses(list);
}

const MASK = "•••••••••••••";

function linkBtn(kind, label, url) {
  if (!url) return "";
  return `<a class="ql ql-${kind}" href="${esc(url)}" target="_blank" rel="noopener">${icon(kind)}<span>${label}</span>${icon("external", "ql-ext")}</a>`;
}

export function quickLinksHtml(b) {
  const html = [
    linkBtn("facebook", "Facebook", facebookUrl(b.facebook)),
    linkBtn("instagram", "Instagram", instagramUrl(b.instagram)),
    linkBtn("whatsapp", "WhatsApp", whatsappUrl(b.whatsapp)),
    linkBtn("web", "Sitio web", normalizeUrl(b.website))
  ].join("");
  return html || `<p class="muted small">Sin redes registradas.</p>`;
}

/**
 * Pinta el detalle de un negocio dentro de `el`.
 * opts: { user, profile, panelLink: bool, onRequest: fn }
 */
export function renderBusinessDetail(el, b, opts = {}) {
  const rows = [];
  const secrets = [];
  const row = (ic, label, value, { secret = false, copy = true } = {}) => {
    if (!value) return;
    const i = secrets.push(String(value)) - 1;
    rows.push(`<div class="drow">
      <span class="drow-ic">${icon(ic)}</span>
      <span class="drow-label">${esc(label)}</span>
      <span class="drow-val ${secret ? "is-secret" : ""}" data-val="${i}">${secret ? MASK : esc(value)}</span>
      <span class="drow-act">
        ${secret ? `<button class="icon-btn" data-reveal="${i}" title="Mostrar">${icon("eye")}</button>` : ""}
        ${copy ? `<button class="icon-btn" data-copy="${i}" data-label="${esc(label)}" title="Copiar">${icon("copy")}</button>` : ""}
      </span></div>`);
  };

  row("mail", "Correo", b.email);
  row("lock", "Contraseña", b.password, { secret: true });
  row("phone", "WhatsApp", b.whatsapp);
  row("bank", "Banco", [b.bankName, b.bankHolder && `Titular: ${b.bankHolder}`].filter(Boolean).join(" · "));
  row("bank", "Cuenta bancaria", b.bankAccount, { secret: true });
  row("bank", "CLABE", b.bankClabe, { secret: true });
  (b.extras || []).forEach((x) => row(x.secret ? "lock" : "info", x.label || "Dato", x.value, { secret: !!x.secret }));

  const proposals = (b.proposals || []).filter((p) => p.title || p.url);
  if (b.logo) {
    rows.push(`<div class="drow"><span class="drow-ic">${icon("image")}</span><span class="drow-label">Logo</span>
      <span class="drow-val"><span class="mini-logo">${logoHtml(b)}</span></span>
      <span class="drow-act"><a class="icon-btn" href="${esc(b.logo)}" download="${esc(b.name || "logo")}" title="Descargar logo">${icon("external")}</a></span></div>`);
  }
  if (proposals.length) {
    rows.push(`<div class="drow drow-wrap"><span class="drow-ic">${icon("doc")}</span><span class="drow-label">Propuestas</span>
      <span class="drow-val proposals">${proposals.map((p) => p.url
        ? `<a class="prop" href="${esc(normalizeUrl(p.url))}" target="_blank" rel="noopener">${icon("doc")}<span>${esc(p.title || "Propuesta")}</span>${icon("chevron")}</a>`
        : `<span class="prop">${icon("doc")}<span>${esc(p.title)}</span></span>`).join("")}</span></div>`);
  }

  el.innerHTML = `
    <article class="biz-detail" style="--accent:${esc(b.color || "#d4a24c")}">
      <div class="biz-hero">${logoHtml(b, "biz-hero-img")}</div>
      <div class="biz-body">
        <header class="biz-head">
          <div><h2>${esc(b.name)}</h2><span class="accent-line"></span></div>
          <span class="badge-lock">${icon("lock")} Acceso protegido</span>
        </header>
        ${b.description ? `<p class="biz-desc">${esc(b.description)}</p>` : ""}
        <div class="quick-links">${quickLinksHtml(b)}</div>
        <div class="data-table">${rows.join("") || `<p class="muted small pad">Aún no hay datos registrados para este negocio.</p>`}</div>
        <div class="biz-actions">
          <button class="btn btn-accent" data-request>${icon("send")} Solicitar un cambio</button>
          ${opts.panelLink ? `<a class="btn btn-ghost" href="negocio.html?id=${encodeURIComponent(b.id)}">Abrir panel del negocio ${icon("chevron")}</a>` : ""}
        </div>
      </div>
    </article>`;

  el.querySelectorAll("[data-copy]").forEach((btn) => btn.addEventListener("click", () =>
    copyText(secrets[btn.dataset.copy], btn.dataset.label)));
  el.querySelectorAll("[data-reveal]").forEach((btn) => btn.addEventListener("click", () => {
    const v = el.querySelector(`[data-val="${btn.dataset.reveal}"]`);
    const showing = v.classList.toggle("revealed");
    v.textContent = showing ? secrets[btn.dataset.reveal] : MASK;
    btn.innerHTML = icon(showing ? "eyeOff" : "eye");
  }));
  el.querySelector("[data-request]").addEventListener("click", () => openRequestModal(b, opts));
}

export function openRequestModal(b, { user, profile, onRequest } = {}) {
  const m = openModal(`
    <div class="modal-head"><h3>Solicitar cambio · ${esc(b.name)}</h3><button class="x" data-close>×</button></div>
    <form id="rq-form" class="form-grid">
      <label class="field"><span>¿Qué quieres cambiar?</span>
        <select id="rq-type">${REQUEST_TYPES.map((t) => `<option>${esc(t)}</option>`).join("")}</select></label>
      <label class="field"><span>Describe el cambio</span>
        <textarea id="rq-msg" rows="5" required maxlength="2000" placeholder="Ej. Actualizar el número de WhatsApp a 55 1234 5678"></textarea></label>
      <p class="form-error" id="rq-err" hidden></p>
      <div class="modal-foot"><button type="button" class="btn btn-ghost" data-close>Cancelar</button>
        <button class="btn btn-gold" type="submit">${icon("send")} Enviar solicitud</button></div>
    </form>`);
  m.el.querySelector("#rq-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      await addDoc(collection(db, "requests"), {
        businessId: b.id,
        businessName: b.name || "",
        uid: user.uid,
        userName: profile.name || "",
        userEmail: user.email || "",
        type: m.el.querySelector("#rq-type").value,
        message: m.el.querySelector("#rq-msg").value.trim(),
        status: "pendiente",
        adminNote: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      m.close();
      toast("Solicitud enviada al administrador");
      onRequest?.();
    } catch (ex) {
      const err = m.el.querySelector("#rq-err");
      err.textContent = errMsg(ex); err.hidden = false; btn.disabled = false;
    }
  });
}
