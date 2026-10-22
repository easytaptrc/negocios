// Utilidades de interfaz compartidas: iconos, toasts, modales, copiado, enlaces e imágenes.

const ICONS = {
  facebook: '<svg viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24"><defs><radialGradient id="igg" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#fdf497"/><stop offset=".05" stop-color="#fdf497"/><stop offset=".45" stop-color="#fd5949"/><stop offset=".6" stop-color="#d6249f"/><stop offset=".9" stop-color="#285AEB"/></radialGradient></defs><rect width="24" height="24" rx="6" fill="url(#igg)"/><rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="16.6" cy="7.4" r="1.1" fill="#fff"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24"><path fill="#25D366" d="M12 0a12 12 0 0 0-10.3 18.1L0 24l6.1-1.6A12 12 0 1 0 12 0z"/><path fill="#fff" d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.1-.7.2l-.9 1.1c-.2.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"/></svg>',
  web: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-7-2a2 2 0 1 1 4 0v2h-4V7zm2 10.5a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6z"/></svg>',
  bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 13h5l1.5 3h5l1.5-3h5"/><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="12" width="4" height="8" rx="1"/><rect x="10" y="7" width="4" height="13" rx="1"/><rect x="16" y="3" width="4" height="17" rx="1"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h11"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
};

export function icon(name, cls = "") {
  return `<span class="ic ${cls}" aria-hidden="true">${ICONS[name] || ""}</span>`;
}

export function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function $(sel, root = document) { return root.querySelector(sel); }
export function $$(sel, root = document) { return [...root.querySelectorAll(sel)]; }

// ---------- Toasts ----------
let toastWrap;
export function toast(msg, type = "ok") {
  if (!toastWrap) {
    toastWrap = document.createElement("div");
    toastWrap.className = "toasts";
    document.body.appendChild(toastWrap);
  }
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  toastWrap.appendChild(t);
  setTimeout(() => t.classList.add("out"), 2600);
  setTimeout(() => t.remove(), 3000);
}

// ---------- Copiar ----------
export async function copyText(text, label = "Texto") {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
  }
  toast(`Copiado: ${label}`);
}

// ---------- Modales ----------
export function openModal(html, { wide = false } = {}) {
  const back = document.createElement("div");
  back.className = "modal-back";
  back.innerHTML = `<div class="modal ${wide ? "modal-wide" : ""}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(back);
  document.body.classList.add("no-scroll");
  const close = () => { back.remove(); if (!document.querySelector(".modal-back")) document.body.classList.remove("no-scroll"); };
  back.addEventListener("mousedown", (e) => { if (e.target === back) close(); });
  back.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
  const onKey = (e) => { if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); } };
  document.addEventListener("keydown", onKey);
  const first = back.querySelector("input, textarea, select");
  if (first) setTimeout(() => first.focus(), 30);
  return { el: back.firstElementChild, close };
}

export function confirmDialog(message, { okText = "Confirmar", danger = false } = {}) {
  return new Promise((resolve) => {
    const m = openModal(`
      <div class="modal-head"><h3>Confirmar</h3></div>
      <p class="modal-text">${esc(message)}</p>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-close>Cancelar</button>
        <button class="btn ${danger ? "btn-danger" : "btn-gold"}" data-ok>${esc(okText)}</button>
      </div>`);
    m.el.querySelector("[data-ok]").addEventListener("click", () => { m.close(); resolve(true); });
    m.el.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => resolve(false)));
  });
}

// ---------- Enlaces ----------
export function normalizeUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

export function instagramUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (s.startsWith("@")) return `https://instagram.com/${s.slice(1)}`;
  if (!s.includes("/") && !s.includes(".")) return `https://instagram.com/${s}`;
  return normalizeUrl(s);
}

export function facebookUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (!s.includes("/") && !s.includes(".")) return `https://facebook.com/${s.replace(/^@/, "")}`;
  return normalizeUrl(s);
}

export function whatsappUrl(v, text = "") {
  const digits = String(v || "").replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

// ---------- Imágenes ----------
// Reduce una imagen a un cuadrado de `max` px y la devuelve como data URL (se guarda en Firestore).
export function resizeImage(file, max = 320) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("El archivo no es una imagen"));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagen no válida"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        let url = c.toDataURL("image/webp", 0.9);
        if (!url.startsWith("data:image/webp")) url = c.toDataURL("image/png");
        resolve(url);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function fmtDate(ts) {
  const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
  if (!d) return "—";
  return d.toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function initials(name) {
  return String(name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// Logo o, si no hay, iniciales sobre el color del negocio.
export function logoHtml(biz, cls = "") {
  if (biz?.logo) return `<img class="${cls}" src="${esc(biz.logo)}" alt="${esc(biz.name)}" loading="lazy">`;
  return `<span class="logo-fallback ${cls}" style="--accent:${esc(biz?.color || "#d4a24c")}">${esc(initials(biz?.name))}</span>`;
}

export const REQUEST_TYPES = [
  "Información general", "Logo / imagen", "Redes sociales", "WhatsApp / contacto",
  "Cuenta bancaria", "Correo / contraseña", "Propuestas", "Otro"
];

export const REQUEST_STATUS = {
  pendiente: { label: "Pendiente", cls: "st-pend" },
  proceso: { label: "En proceso", cls: "st-proc" },
  resuelta: { label: "Resuelta", cls: "st-done" },
  rechazada: { label: "Rechazada", cls: "st-rej" }
};

export function statusBadge(s) {
  const st = REQUEST_STATUS[s] || REQUEST_STATUS.pendiente;
  return `<span class="status ${st.cls}">${st.label}</span>`;
}
