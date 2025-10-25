// script.js
document.addEventListener("DOMContentLoaded", () => {
  const statsContainer = document.querySelector("#stats");
  const socialContainer = document.querySelector("#socials");

  // --- Render Stats ---
  CONFIG.stats.forEach((item) => {
    const div = document.createElement("div");
    div.className = "stat-card";
    div.innerHTML = <h3>${item.value}</h3><p>${item.label}</p>;
    statsContainer.appendChild(div);
  });

  // --- Render Social Links ---
  for (const [key, url] of Object.entries(CONFIG.socials)) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    a.className = "social-link";
    socialContainer.appendChild(a);
  }

  // --- Portal button handler ---
  const portalBtn = document.querySelector("#portal-login");
  if (portalBtn) {
    portalBtn.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Portal access in progress. Coming soon!");
    });
  }
});
