// DO NOT wrap this in <script> tags. Pure JS only.
// Replace the placeholders before deploying.

window.KARBA_CONFIG = {
  BACKEND_URL: "https://karba-backend-xxxx.onrender.com", // ← your Render service URL
  RECAPTCHA_SITE_KEY: "YOUR_RECAPTCHA_V3_SITE_KEY"        // ← reCAPTCHA v3 site key
};
console.log("KARBA_CONFIG", window.KARBA_CONFIG);
