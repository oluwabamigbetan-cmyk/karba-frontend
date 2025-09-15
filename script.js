// --- tiny helpers
const $ = (sel, p=document) => p.querySelector(sel);
const $$ = (sel, p=document) => [...p.querySelectorAll(sel)];

const CFG = window.KARBA_CONFIG || {};
const STATUS = $('#status');
const FORM = $('#lead-form');
const BTN = $('#submitBtn');
const HERO_IMG = $('#heroImg');

function setStatus(msg, color) {
  if (!STATUS) return;
  STATUS.textContent = msg;
  STATUS.style.color = color || '';
}

function disable(disabled) {
  if (BTN) BTN.disabled = disabled;
  if (BTN) BTN.textContent = disabled ? 'Submitting…' : 'Submit';
}

// --- hero slider (local files only)
const heroImages = [
  'assets/hero-1.jpg',
  'assets/hero-2.jpg',
  'assets/hero-3.jpg',
  'assets/hero-4.jpg'
].filter(Boolean);

(function startHero(){
  if (!HERO_IMG) return;
  let idx = 0;
  const tick = () => {
    HERO_IMG.src = heroImages[idx % heroImages.length];
    idx += 1;
  };
  tick();
  setInterval(tick, 6000);
})();

// --- on load: health check + prepare recaptcha
window.addEventListener('DOMContentLoaded', () => {
  // Health check
  if (!CFG.BACKEND_URL) {
    setStatus('Backend URL missing in config.js', '#ff9aa2');
  } else {
    fetch(CFG.BACKEND_URL + '/api/health')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('API health error')))
      .then(() => setStatus('[HEALTH] Backend OK'))
      .catch(() => setStatus('Backend unreachable. Check Render URL & CORS.', '#ff9aa2'));
  }

  // Prepare reCAPTCHA v3 "explicit" render so we can execute later
  const waitForRecaptcha = () => new Promise(res => {
    const check = () => (window.grecaptcha && window.grecaptcha.render) ? res() : setTimeout(check, 200);
    check();
  });

  waitForRecaptcha().then(() => {
    // create an invisible widget we can execute for tokens
    window.__recaptchaWidgetId = grecaptcha.render('recaptcha-container', {
      sitekey: CFG.RECAPTCHA_SITE_KEY,
      size: 'invisible',
      badge: 'bottomright'
    });
  });
});

// --- form submit
FORM?.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('');
  disable(true);

  try {
    const nameEl = $('input[name="name"]', FORM);
    const emailEl = $('input[name="email"]', FORM);
    const phoneEl = $('input[name="phone"]', FORM);
    const serviceEl = $('select[name="service"]', FORM);
    const messageEl = $('textarea[name="message"]', FORM);

    const name = (nameEl?.value || '').trim();
    const email = (emailEl?.value || '').trim();
    const phone = (phoneEl?.value || '').trim();
    const service = (serviceEl?.value || '').trim();
    const message = (messageEl?.value || '').trim();

    if (!name || !email) {
      setStatus('Please enter your name and email.', '#ff9aa2');
      disable(false);
      return;
    }

    // Get v3 token (execute invisible widget)
    if (!window.grecaptcha || typeof grecaptcha.execute !== 'function') {
      throw new Error('reCAPTCHA not loaded');
    }
    const recaptchaToken = await grecaptcha.execute(window.__recaptchaWidgetId);

    const body = { name, email, phone, service, message, recaptchaToken };

    const r = await fetch(CFG.BACKEND_URL + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await r.text();
    if (!r.ok) throw new Error(text || 'HTTP error');

    setStatus('Thanks — we’ll be in touch shortly.');
    FORM.reset();
  } catch (err) {
    console.error(err);
    setStatus('Network or security error — please try again.', '#ff9aa2');
  } finally {
    disable(false);
  }
});
