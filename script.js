(function() {
  const CFG = window.KARBA_CONFIG || {};
  const $ = (sel, p = document) => p.querySelector(sel);

  // ---- Hero slider ----
  const heroImg = $('#heroImg');
  const heroImages = [
    'assets/hero-1.jpg',
    'assets/hero-2.jpg',
    'assets/hero-3.jpg',
    'assets/hero-4.jpg'
  ];
  let idx = 0;
  function showHero(i) {
    if (!heroImg) return;
    heroImg.style.opacity = '0';
    setTimeout(() => {
      heroImg.src = heroImages[i % heroImages.length];
      heroImg.onload = () => { heroImg.style.opacity = '1'; };
    }, 200);
  }
  showHero(idx++);
  setInterval(() => showHero(idx++), 6000);

  // ---- Health ping ----
  const statusEl = $('#status');
  const setStatus = (t, color) => { if (statusEl) { statusEl.textContent = t; statusEl.style.color = color || '#9bd6ff'; } };

  async function ping() {
    if (!CFG.BACKEND_URL) { setStatus('Backend URL missing in config.js', '#ff9d9d'); return; }
    try {
      const r = await fetch(CFG.BACKEND_URL + '/api/health');
      const j = await r.json();
      setStatus(j.ok ? '[HEALTH] Backend OK' : 'Backend error');
    } catch (e) {
      setStatus('Network or security error — please try again.', '#ff9d9d');
    }
  }
  ping();

  // ---- Form submit ----
  const form = $('#lead-form');
  const btn  = $('#submitBtn');

  async function getRecaptchaToken() {
    const key = CFG.RECAPTCHA_SITE_KEY;
    if (!key || !window.grecaptcha) return null;
    await new Promise(res => window.grecaptcha.ready(res));
    return await window.grecaptcha.execute(key, { action: 'lead' });
  }

  function disable(flag) { if (btn) btn.disabled = !!flag; if (btn) btn.textContent = flag ? 'Submitting…' : 'Submit'; }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameEl = $('#name'), emailEl = $('#email'), phoneEl = $('#phone');
      const serviceEl = $('#service'), messageEl = $('#message');
      const name = (nameEl?.value || '').trim();
      const email = (emailEl?.value || '').trim();
      const phone = (phoneEl?.value || '').trim();
      const service = (serviceEl?.value || '').trim();
      const message = (messageEl?.value || '').trim();

      if (!name || !email || !service) {
        setStatus('Please enter your name, email, and service.', '#ff9d9d');
        return;
      }
      if (!CFG.BACKEND_URL) {
        setStatus('Backend URL missing in config.js', '#ff9d9d');
        return;
      }

      disable(true);
      setStatus('Submitting…');

      try {
        const recaptchaToken = await getRecaptchaToken();
        const r = await fetch(CFG.BACKEND_URL + '/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, service, message, recaptchaToken })
        });
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j.message || 'HTTP ' + r.status);
        setStatus('Thanks — we’ll be in touch shortly.');
        form.reset();
      } catch (err) {
        setStatus('Network or security error — please try again.', '#ff9d9d');
        console.error(err);
      } finally {
        disable(false);
      }
    });
  }

  // footer year
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
