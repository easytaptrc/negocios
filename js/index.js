// Portal (index): órbita de negocios, pestañas y detalle del negocio seleccionado.
import { requireAuth, renderTopbar, errMsg } from "./auth.js";
import { loadBusinesses, renderBusinessDetail } from "./business-view.js";
import { $, $$, esc, icon, logoHtml } from "./ui.js";

const { user, profile, org } = await requireAuth();
const isAdmin = profile.role === "admin";
document.title = `${org.name} · ${org.tagline || "Portal"}`;
const topbar = $("#topbar");
renderTopbar(topbar, { org, profile, user, active: "inicio" });
topbar.hidden = false;
$("#app").hidden = false;

let list = [];
try {
  list = await loadBusinesses(profile);
} catch (e) {
  $("#detail").innerHTML = `<div class="empty"><h3>No se pudieron cargar los negocios</h3><p>${esc(errMsg(e))}</p></div>`;
}
// El administrador ve también los negocios ocultos (atenuados); el resto solo los activos.
if (!isAdmin) list = list.filter((b) => b.active !== false);

renderOrbit();
renderTabs();

if (!list.length) {
  $("#detail").innerHTML = `<div class="empty">
    <h3>${isAdmin ? "Aún no hay negocios" : "No tienes negocios asignados"}</h3>
    <p>${isAdmin ? "Agrégalos desde el panel de administración." : "Pide al administrador que te dé acceso."}</p>
    ${isAdmin ? `<a class="btn btn-gold" href="admin.html#negocios">${icon("plus")} Agregar negocios</a>` : ""}</div>`;
} else {
  const fromHash = decodeURIComponent(location.hash.slice(1));
  select(list.some((b) => b.id === fromHash) ? fromHash : list[0].id);
}

function renderOrbit() {
  const words = String(org.name || "").trim().split(/\s+/);
  const last = words.pop() || "";
  const center = org.logo
    ? `<img src="${esc(org.logo)}" alt="${esc(org.name)}">`
    : `<span class="oc-1">${esc(words.join(" "))}</span><span class="oc-2">${esc(last)}</span><span class="oc-line"></span>`;
  const n = list.length;
  const size = n <= 6 ? 27 : Math.max(14, 27 - (n - 6) * 2.2);
  const nodes = list.map((b, i) => {
    const a = (-90 + (i * 360) / Math.max(n, 1)) * (Math.PI / 180);
    const x = 50 + 35 * Math.cos(a), y = 50 + 35 * Math.sin(a);
    return `<button class="orbit-node ${b.active === false ? "off" : ""}" data-id="${esc(b.id)}" title="${esc(b.name)}"
      style="left:${x}%;top:${y}%;width:${size}%;--accent:${esc(b.color || "#d4a24c")}">${logoHtml(b)}</button>`;
  }).join("");
  $("#orbit").innerHTML = `<div class="orbit-ring"></div><div class="orbit-center">${center}</div>${nodes}`;
  $$(".orbit-node").forEach((el) => el.addEventListener("click", () => { select(el.dataset.id); scrollToDetail(); }));
}

function renderTabs() {
  $("#tabs").innerHTML = list.map((b) => `
    <button class="tab" data-id="${esc(b.id)}" style="--accent:${esc(b.color || "#d4a24c")}">
      <span class="tab-logo">${logoHtml(b)}</span>
      <span class="tab-name">${esc(b.name)}${b.active === false ? ' <small class="muted">(oculto)</small>' : ""}</span>
      ${icon("chevron")}
    </button>`).join("");
  $$(".tab").forEach((el) => el.addEventListener("click", () => { select(el.dataset.id); scrollToDetail(); }));
}

function select(id) {
  const b = list.find((x) => x.id === id);
  if (!b) return;
  $$("[data-id]").forEach((el) => el.classList.toggle("on", el.dataset.id === id));
  renderBusinessDetail($("#detail"), b, { user, profile, panelLink: true });
  history.replaceState(null, "", `#${encodeURIComponent(id)}`);
}

function scrollToDetail() {
  if (window.innerWidth < 900) $("#detail").scrollIntoView({ behavior: "smooth", block: "start" });
}
