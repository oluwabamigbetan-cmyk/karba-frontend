// script.js

// Dynamically load reCAPTCHA v3
(function () {
  const recaptchaScript = document.createElement("script");
  recaptchaScript.src = `https://www.google.com/recaptcha/api.js?render=${window.KARBA_CONFIG.RECAPTCHA_SITE_KEY}`;
  document.head.appendChild(recaptchaScript);
})();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("consultation-form");
  const statusDiv = document.getElementById("form-status");

  if (!form || !statusDiv) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Clear previous messages
    statusDiv.textContent = "Submitting...";
    statusDiv.style.color = "#FFD700"; // gold while processing

    // Safety checks
    if (!window.KARBA_CONFIG || !window.KARBA_CONFIG.BACKEND_URL) {
      statusDiv.textContent = "Setup error: BACKEND_URL missing.";
      statusDiv.style.color = "red";
      return;
    }

    if (!window.grecaptcha) {
      statusDiv.textContent = "reCAPTCHA not loaded. Please refresh.";
      statusDiv.style.color = "red";
      return;
    }

    try {
      // Get reCAPTCHA token
      const token = await window.grecaptcha.execute(
        window.KARBA_CONFIG.RECAPTCHA_SITE_KEY,
        { action: "submit" }
      );

      // Collect form data
      const data = {
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value,
        service: form.service.value,
        message: form.message.value,
        recaptchaToken: token,
      };

      // Send to backend
      const response = await fetch(
        `${window.KARBA_CONFIG.BACKEND_URL}/api/leads`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (response.ok) {
        statusDiv.textContent = "✅ Thank you! We will contact you shortly.";
        statusDiv.style.color = "green";
        form.reset();
      } else {
        statusDiv.textContent = `❌ Error: ${result.error || "Unknown error"}`;
        statusDiv.style.color = "red";
      }
    } catch (err) {
      console.error(err);
      statusDiv.textContent = "❌ Network error. Please try again.";
      statusDiv.style.color = "red";
    }
  });
});
