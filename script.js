// script.js
import { SITE } from "./config.js";

// ---- NAV (optional) ----
// If you want to auto-build nav from config, target your nav list here.

// ---- HERO STATS ----
(function renderHeroStats() {
  const host = document.getElementById("hero-stats");
  if (!host) return;

  host.innerHTML = ""; // clear

  SITE.heroStats.forEach(card => {
    const item = document.createElement("article");
    item.className = "stat_card";

    const label = document.createElement("div");
    label.className = "stat_label";
    label.textContent = card.label;

    const value = document.createElement("div");
    value.className = "stat_value";
    value.textContent = card.value || "";

    item.appendChild(label);

    // If the card has links (Support), render as buttons
    if (Array.isArray(card.links) && card.links.length) {
      const linkWrap = document.createElement("div");
      linkWrap.className = "stat_links";
      card.links.forEach(l => {
        const a = document.createElement("a");
        a.className = "btn btn-ghost btn-xs";
        a.href = l.href;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = l.text;
        linkWrap.appendChild(a);
      });
      item.appendChild(linkWrap);
    } else {
      // normal “value” card
      if (card.value) item.appendChild(value);
    }

    host.appendChild(item);
  });
})();

// ---- FOOTER SOCIALS ----
(function renderSocials() {
  const wrap = document.getElementById("socials");
  if (!wrap) return;

  wrap.innerHTML = "";
  SITE.socials.forEach(s => {
    const a = document.createElement("a");
    a.className = "social_link";
    a.href = s.href;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = s.name;
    wrap.appendChild(a);
  });
})();

// ---- PORTAL MODAL ----
(function portalModal() {
  const btn = document.getElementById("portalLoginBtn");
  const modal = document.getElementById("portalModal");
  const title = document.getElementById("portalModalTitle");
  const body = document.getElementById("portalModalBody");
  const actions = document.getElementById("portalModalActions");
  const closeBtn = document.getElementById("portalModalClose");

  if (!btn || !modal) return;

  // content
  title.textContent = SITE.portal.modalTitle;
  body.textContent = SITE.portal.modalBody;
  actions.innerHTML = "";
  SITE.portal.actions.forEach(act => {
    const a = document.createElement("a");
    a.href = act.href;
    a.target = "_blank";
    a.rel = "noopener";
    a.className = btn ${act.kind === "primary" ? "btn-gold" : "btn-ghost"};
    a.textContent = act.label;
    actions.appendChild(a);
  });

  function open() {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }
  function close() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });
  closeBtn.addEventListener("click", close);
  modal.querySelector(".modal_backdrop").addEventListener("click", close);
})();
