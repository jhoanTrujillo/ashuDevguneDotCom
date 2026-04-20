/* ============================================================
   ashudevgune.com — main
   i18n loader, nav, lightbox, reveal
   ============================================================ */

const SUPPORTED = ["en", "de"];
const DEFAULT_LANG = "en";
const LS_KEY = "ashudevgune.lang";

/* ---------- i18n ---------- */

function getPath(obj, key) {
  return key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function pickLang() {
  const stored = localStorage.getItem(LS_KEY);
  if (stored && SUPPORTED.includes(stored)) return stored;
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  return SUPPORTED.includes(nav) ? nav : DEFAULT_LANG;
}

async function loadDict(lang) {
  const res = await fetch(`/locale/${lang}.json`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`locale ${lang} ${res.status}`);
  return res.json();
}

function applyDict(dict) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const val = getPath(dict, el.dataset.i18n);
    if (val === undefined) return;
    if (el.dataset.i18nHtml === "true") el.innerHTML = val;
    else el.textContent = val;
  });

  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(",").forEach((pair) => {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      const val = getPath(dict, key);
      if (val !== undefined && attr) el.setAttribute(attr, val);
    });
  });

  const title = getPath(dict, "meta." + (document.body.dataset.page || "home") + ".title");
  if (title) document.title = title;
}

async function setLanguage(lang) {
  if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
  try {
    const dict = await loadDict(lang);
    document.documentElement.lang = lang;
    applyDict(dict);
    localStorage.setItem(LS_KEY, lang);
    const select = document.querySelector("[data-lang-select]");
    if (select) select.value = lang;
  } catch (err) {
    console.error("[i18n] failed:", err);
  }
}

/* ---------- nav (mobile toggle) ---------- */

function initNav() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!toggle || !nav) return;

  const close = () => {
    nav.dataset.open = "false";
    toggle.setAttribute("aria-expanded", "false");
  };
  const open = () => {
    nav.dataset.open = "true";
    toggle.setAttribute("aria-expanded", "true");
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    nav.dataset.open === "true" ? close() : open();
  });

  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));

  document.addEventListener("click", (e) => {
    if (nav.dataset.open !== "true") return;
    if (!nav.contains(e.target) && !toggle.contains(e.target)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.dataset.open === "true") close();
  });
}

/* ---------- language selector ---------- */

function initLangSelect() {
  const select = document.querySelector("[data-lang-select]");
  if (!select) return;
  select.addEventListener("change", (e) => setLanguage(e.target.value));
}

/* ---------- lightbox (gallery) ---------- */

function initLightbox() {
  const gallery = document.querySelector("[data-gallery]");
  const dlg = document.querySelector("[data-lightbox]");
  if (!gallery || !dlg) return;

  const img = dlg.querySelector("img");
  const cap = dlg.querySelector("[data-lightbox-caption]");
  const btnClose = dlg.querySelector("[data-lightbox-close]");
  const btnPrev = dlg.querySelector("[data-lightbox-prev]");
  const btnNext = dlg.querySelector("[data-lightbox-next]");

  const items = Array.from(gallery.querySelectorAll(".gallery__item"));
  let index = 0;

  function show(i) {
    index = (i + items.length) % items.length;
    const src = items[index].dataset.full || items[index].querySelector("img").src;
    const alt = items[index].querySelector("img").alt || "";
    img.src = src;
    img.alt = alt;
    if (cap) cap.textContent = alt;
  }

  items.forEach((item, i) =>
    item.addEventListener("click", () => {
      show(i);
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    })
  );

  btnClose?.addEventListener("click", () => dlg.close());
  btnPrev?.addEventListener("click", () => show(index - 1));
  btnNext?.addEventListener("click", () => show(index + 1));

  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });
  document.addEventListener("keydown", (e) => {
    if (!dlg.open) return;
    if (e.key === "ArrowRight") show(index + 1);
    if (e.key === "ArrowLeft") show(index - 1);
  });
}

/* ---------- reveal on scroll ---------- */

function initReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
  );
  targets.forEach((el, i) => {
    if (el.parentElement?.classList.contains("stagger")) {
      el.style.setProperty("--i", Array.from(el.parentElement.children).indexOf(el));
    }
    io.observe(el);
  });
}

/* ---------- boot ---------- */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initLangSelect();
  initLightbox();
  initReveal();
  setLanguage(pickLang());
});
