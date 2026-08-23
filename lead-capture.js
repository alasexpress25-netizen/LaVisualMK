/* ══════════════════════════════════════════════════════════
   LEAD-CAPTURE.JS — Plantilla reutilizable
   Tracking de clicks + popup de leads + formulario de contacto.

   Requiere que ANTES de este script ya esté cargado:
     1) <script src="config.js"></script>   (con supabaseUrl y supabaseAnonKey)
     2) <script src=".../supabase-js@2"></script>

   IMPORTANTE: este script SOLO usa la anon key (pública, segura
   de exponer). Nunca pegues acá una service_role key. El guardado
   real del lead pasa por una Edge Function ("submit-lead") que
   corre del lado del servidor con permisos elevados — así el
   navegador nunca toca esa clave.

   HTML que este script espera encontrar en la página
   (podés copiar la estructura del index.html de La Visual Mk):
     - elementos con  data-track="algo"      → tracking de clicks
     - #lead-overlay, #lead-form-area, #lead-success,
       #lead-confirm-close                   → popup de leads
     - #cf-nome #cf-email #cf-empresa #cf-mensagem
       #cf-msg #cf-btn                       → formulario de contacto
══════════════════════════════════════════════════════════ */

(function () {
  const SB_URL  = APP_CONFIG.supabaseUrl;
  const SB_ANON = APP_CONFIG.supabaseAnonKey;
  const SUBMIT_LEAD_URL = `${SB_URL}/functions/v1/submit-lead`;

  /* ── 1) TRACKING DE CLICKS (directo a Supabase, anon key) ── */
  (function trackingClicks() {
    const PAGE = window.location.pathname || '/';
    const UA   = navigator.userAgent;
    let cachedIp = null;

    async function getIp() {
      if (cachedIp) return cachedIp;
      try { const r = await fetch('https://api.ipify.org?format=json'); cachedIp = (await r.json()).ip; }
      catch (_) { cachedIp = 'unknown'; }
      return cachedIp;
    }

    async function track(buttonId, el, evt) {
      const ip = await getIp();
      const click_x = evt ? Math.round((evt.clientX / window.innerWidth)  * 10000) / 100 : null;
      const click_y = evt ? Math.round((evt.clientY / window.innerHeight) * 10000) / 100 : null;
      try {
        await fetch(SB_URL + '/rest/v1/click_events', {
          method: 'POST',
          headers: {
            'apikey': SB_ANON, 'Authorization': 'Bearer ' + SB_ANON,
            'Content-Type': 'application/json', 'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            button_id:   buttonId,
            ip:          ip,
            page:        PAGE,
            user_agent:  UA,
            button_text: (el.textContent || '').trim().slice(0, 80),
            href:        el.href || el.getAttribute('href') || '',
            referrer:    document.referrer || '',
            click_x, click_y
          })
        });
      } catch (_) {}
    }

    document.addEventListener('click', function (e) {
      const el = e.target.closest('[data-track]');
      if (el) track(el.getAttribute('data-track'), el, e);
    });
  })();

  /* ── 2) GUARDAR LEAD (vía Edge Function, sin claves sensibles en el navegador) ── */
  async function guardarLead(datos) {
    const res = await fetch(SUBMIT_LEAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'No se pudo guardar el lead');
    return json;
  }
  window.guardarLead = guardarLead; // exponer por si el HTML del cliente lo necesita llamar directo

  /* ── 3) POPUP DE LEADS — 8s + exit intent, 1 vez por sesión ── */
  (function initPopup() {
    const overlay = document.getElementById('lead-overlay');
    if (!overlay) return; // esta página no tiene popup, no hacemos nada

    const STORAGE_KEY = 'lv_popup_shown';
    const CLOSED_KEY  = 'lv_popup_closed';
    const closeBtn    = overlay.querySelector('.lead-close, [data-popup-close]');
    let closingAttempt = false;

    function abrir() {
      if (sessionStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(CLOSED_KEY)) return;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      sessionStorage.setItem(STORAGE_KEY, '1');
    }

    setTimeout(abrir, 8000);

    document.addEventListener('mouseleave', e => {
      if (e.clientY < 50 && !sessionStorage.getItem(CLOSED_KEY)) abrir();
    });

    function showConfirmClose() {
      if (closingAttempt) return;
      closingAttempt = true;
      const formArea = document.getElementById('lead-form-area');
      const success   = document.getElementById('lead-success');
      const confirm   = document.getElementById('lead-confirm-close');
      if (formArea) formArea.style.display = 'none';
      if (success)  success.style.display  = 'none';
      if (confirm)  confirm.classList.add('show');
    }

    function realClose() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      sessionStorage.setItem(CLOSED_KEY, '1');
    }

    if (closeBtn) closeBtn.addEventListener('click', () => {
      const success = document.getElementById('lead-success');
      if (success && success.style.display === 'block') return realClose();
      showConfirmClose();
    });

    overlay.addEventListener('click', e => {
      if (e.target !== overlay) return;
      const success = document.getElementById('lead-success');
      if (success && success.style.display === 'block') return realClose();
      showConfirmClose();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) {
        const success = document.getElementById('lead-success');
        if (success && success.style.display === 'block') return realClose();
        showConfirmClose();
      }
    });

    window.stayOnPopup = function () {
      closingAttempt = false;
      const confirm = document.getElementById('lead-confirm-close');
      const formArea = document.getElementById('lead-form-area');
      if (confirm) confirm.classList.remove('show');
      if (formArea) formArea.style.display = '';
    };
    window.confirmClose = realClose;
    window.realClosePopup = realClose;
  })();

  /* ── 4) FORMULARIO DE CONTACTO → guardarLead() ── */
  window.submitContacto = async function () {
    const nombre  = document.getElementById('cf-nome')?.value.trim()  || '';
    const email   = document.getElementById('cf-email')?.value.trim() || '';
    const empresa = document.getElementById('cf-empresa')?.value.trim() || '';
    const mensaje = document.getElementById('cf-mensagem')?.value.trim() || '';
    const msgEl   = document.getElementById('cf-msg');
    const btn     = document.getElementById('cf-btn');

    if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (msgEl) { msgEl.style.color = '#e74c3c'; msgEl.textContent = 'Completá nombre y email válido.'; msgEl.style.display = 'block'; }
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

    const notas = [empresa ? `Empresa: ${empresa}` : '', mensaje ? `Consulta: ${mensaje}` : ''].filter(Boolean).join(' | ');

    try {
      await guardarLead({ nombre, email, telefono: '', fuente: 'formulario_contacto', notas });
      if (msgEl) { msgEl.style.color = 'var(--gold, #2ecc71)'; msgEl.textContent = '✓ Mensaje recibido, te contactamos pronto.'; msgEl.style.display = 'block'; }
      if (btn) btn.textContent = 'Enviado ✓';
      ['cf-nome','cf-email','cf-empresa','cf-mensagem'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    } catch (err) {
      if (msgEl) { msgEl.style.color = '#e74c3c'; msgEl.textContent = 'Error al enviar. Probá de nuevo.'; msgEl.style.display = 'block'; }
      if (btn) { btn.disabled = false; btn.textContent = 'Solicitar diagnóstico gratuito'; }
    }
  };

  /* ── 5) POPUP → redirige al formulario de clientes (ajustar URL por cliente) ── */
  window.submitLead = function () {
    const overlay = document.getElementById('lead-overlay');
    if (overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; }
    sessionStorage.setItem('lv_popup_closed', '1');
    if (APP_CONFIG.formularioClientesUrl) window.location.href = APP_CONFIG.formularioClientesUrl;
  };

})();
