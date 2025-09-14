// script.js — robust form + reCAPTCHA v3 + health + hero slider

(() => {
  const CFG = window.KARBA_CONFIG || {};
  const $ = (sel, root = document) => root.querySelector(sel);

  // ------- small helpers -------
  const statusEl = $('#form-status');
  const btn = $('#submitBtn');
  const setStatus = (txt, color) => {
    if (!statusEl) return;
    statusEl.textContent = txt || '';
    statusEl.style.color = color || '';
  };
  const disable = (v) => { if (btn) btn.disabled = !!v; };

  // ------- hero (optional) -------
  const heroImg = $('#heroImg');
  const heroImages = [
    'assets/hero-1.jpg',
    'assets/hero-2.jpg',
  ].filter(Boolean);
  if (heroImg && heroImages.length) {
    let i = 0;
    setInterval(() => {
      i = (i + 1) % heroImages.length;
      heroImg.style.opacity = '0';
      setTimeout(() => {
        heroImg.src = heroImages[i];
        heroImg.style.opacity = '1';
      }, 250);
    }, 6000);
  }

  // ------- backend health ping (optional UI strip) -------
  const health = () => {
    if (!CFG.BACKEND_URL) return;
    fetch(CFG.BACKEND_URL + '/api/health', { credentials: 'omit' })
      .then(r => r.json())
      .then(() => console.log('API OK'))
      .catch(() => console.log('API unreachable'));
  };
  setTimeout(health, 500); // after load

  // ------- recaptcha helpers -------
  const getRecaptchaToken = async () => {
    if (!window.grecaptcha) throw new Error('grecaptcha not loaded');
    if (!CFG.RECAPTCHA_SITE_KEY) throw new Error('Missing reCAPTCHA site key');
    await new Promise(res => window.grecaptcha.ready(res));
    return window.grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, { action: 'lead' });
  };

  // ------- form handler -------
  const form = $('#lead-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    const nameEl = $('#fullName');
    const emailEl = $('#email');
    const phoneEl = $('#phone');
    const serviceEl = $('#service');
    const messageEl = $('#message');

    const name = (nameEl?.value || '').trim();
    const email = (emailEl?.value || '').trim();
    const phone = (phoneEl?.value || '').trim();
    const service = (serviceEl?.value || '').trim();
    const message = (messageEl?.value || '').trim();

    // basic validation
    if (!name || !email) {
      setStatus('Please enter your name and email.', '#ffb');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus('Please enter a valid email address.', '#ffb');
      return;
    }
    if (!service) {
      setStatus('Please select a service of interest.', '#ffb');
      return;
    }
    if (!CFG.BACKEND_URL) {
      setStatus('Backend URL missing in config.js', '#ffb');
      return;
    }

    disable(true);
    setStatus('Securing…');

    try {
      const recaptchaToken = await getRecaptchaToken();
      setStatus('Sending…');

      const body = {
        name, email, phone, service, message,
        recaptchaToken
      };

      const res = await fetch(CFG.BACKEND_URL + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || ('HTTP ' + res.status));

      setStatus('Thanks — we’ll be in touch shortly.', '#bff5bf');
      form.reset();
    } catch (err) {
      console.error(err);
      // common messages
      if (String(err).includes('recaptcha')) {
        setStatus('reCAPTCHA error — please refresh and try again.', '#ffb');
      } else if (String(err).includes('CORS')) {
        setStatus('CORS error — backend not allowing this domain.', '#ffb');
      } else {
        setStatus('Network error — please try again.', '#ffb');
      }
    } finally {
      disable(false);
    }
  });
})();
