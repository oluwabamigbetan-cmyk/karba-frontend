/* script.js – hero slider + health check + reCAPTCHA v3 + form submit */
(() => {
  'use strict';

  // ------------ helpers
  const $ = (sel, p = document) => p.querySelector(sel);

  const statusEl = $('#form-status');
  const form = $('#lead-form');
  const btn = $('#submitBtn');

  function setStatus(txt, color) {
    if (!statusEl) return;
    statusEl.textContent = txt;
    statusEl.style.color = color || '';
  }
  function setBusy(b) {
    if (btn) btn.disabled = !!b;
    if (btn) btn.textContent = b ? 'Submitting…' : 'Submit';
  }

  // ------------ hero slider (define ONCE)
  const heroEl = $('#heroImg'); // optional: if you use an <img id="heroImg">
  const heroImages = [
    'assets/hero-1.jpg',
    'assets/hero-2.jpg',
    'assets/hero-3.jpg',
    'assets/hero-4.jpg'
  ].filter(Boolean);

  if (heroEl && heroImages.length) {
    let i = 0;
    setInterval(() => {
      i = (i + 1) % heroImages.length;
      heroEl.style.opacity = '0';
      setTimeout(() => {
        heroEl.src = heroImages[i];
        heroEl.style.opacity = '1';
      }, 250);
    }, 5000);
  }

  // ------------ health check
  const CFG = window.KARBA_CONFIG || {};
  if (!CFG.BACKEND_URL) {
    setStatus('Backend URL missing in config.', '#f66');
  } else {
    fetch(`${CFG.BACKEND_URL}/api/health`)
      .then(r => r.json())
      .then(() => setStatus('[HEALTH] Backend OK', '#9f9'))
      .catch(() => setStatus('[HEALTH] API unreachable', '#f99'));
  }

  // ------------ reCAPTCHA v3 helpers
  function grecaptchaReady() {
    return new Promise((resolve, reject) => {
      let c = 0;
      const timer = setInterval(() => {
        c++;
        if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
          clearInterval(timer);
          window.grecaptcha.ready(resolve);
        } else if (c > 200) {
          clearInterval(timer);
          reject(new Error('reCAPTCHA not loaded'));
        }
      }, 50);
    });
  }

  async function getRecaptchaToken(action = 'lead') {
    if (!CFG.RECAPTCHA_SITE_KEY) throw new Error('Missing reCAPTCHA SITE key');
    await grecaptchaReady();
    return await window.grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, { action });
  }

  // ------------ submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // read fields safely (avoid null)
      const nameEl = $('#name');
      const emailEl = $('#email');
      const phoneEl = $('#phone');
      const serviceEl = $('#service');
      const messageEl = $('#message');

      const name = nameEl?.value.trim();
      const email = emailEl?.value.trim();
      const phone = phoneEl?.value.trim();
      const service = serviceEl?.value.trim();
      const message = messageEl?.value.trim();

      if (!name || !email) {
        setStatus('Please enter your name and email.', '#f66');
        return;
      }

      setBusy(true);
      setStatus('Securing…');

      try {
        const token = await getRecaptchaToken('lead');
        setStatus('Sending…');

        const res = await fetch(`${CFG.BACKEND_URL}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, service, message, recaptchaToken: token })
        });

        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

        setStatus('Thanks — we’ll be in touch shortly.', '#9f9');
        form.reset();
      } catch (err) {
        console.error(err);
        // 400 from backend usually means reCAPTCHA verification failed
        const msg = `${String(err.message || err)}`.toLowerCase().includes('recaptcha')
          ? 'reCAPTCHA check failed — please refresh and try again.'
          : 'Network error — please try again.';
        setStatus(msg, '#f99');
      } finally {
        setBusy(false);
      }
    });
  }
})();
