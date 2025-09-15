// ===== UTIL =====
function setStatus(msg, isError = false) {
  const statusEl = document.getElementById("form-status");
  if (statusEl) {
    statusEl.textContent = msg;
    statusEl.style.color = isError ? "red" : "lime";
  }
}

// ===== HERO SLIDER =====
const heroImages = [
  "assets/hero-1.jpg",
  "assets/hero-2.jpg",
  "assets/hero-3.jpg",
  "assets/hero-4.jpg"
];
let heroIndex = 0;

function rotateHero() {
  const heroEl = document.getElementById("hero");
  if (heroEl) {
    heroEl.style.backgroundImage = `url(${heroImages[heroIndex]})`;
    heroIndex = (heroIndex + 1) % heroImages.length;
  }
}
setInterval(rotateHero, 6000);
rotateHero();

// ===== BACKEND HEALTH CHECK =====
async function checkBackend() {
  try {
    const res = await fetch(`${window.KARBA_CONFIG.BACKEND_URL}/api/health`);
    if (res.ok) {
      console.log("[HEALTH] Backend OK");
    } else {
      console.warn("[HEALTH] Backend unhealthy");
    }
  } catch (err) {
    console.error("[HEALTH] Error connecting backend", err);
  }
}
checkBackend();

// ===== FORM SUBMIT =====
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lead-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("Submitting...");

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const service = document.getElementById("service").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email) {
      setStatus("Please enter your name and email.", true);
      return;
    }

    try {
      // reCAPTCHA v3 token
      const token = await grecaptcha.execute(
        window.KARBA_CONFIG.RECAPTCHA_SITE_KEY,
        { action: "submit" }
      );

      // POST lead to backend
      const res = await fetch(`${window.KARBA_CONFIG.BACKEND_URL}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, service, message, token }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("✅ Thank you! Your request was sent successfully.");
        form.reset();
      } else {
        setStatus(`Error: ${data.error || "Failed to submit."}`, true);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setStatus("Network error. Please try again.", true);
    }
  });
});
