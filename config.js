/* ══════════════════════════════════════════════════════════
   CONFIG.JS — Configuración por cliente
   Para reutilizar este panel admin con un cliente nuevo,
   SOLO hay que cambiar los valores de este archivo.
   No tocar index.html.
══════════════════════════════════════════════════════════ */

const APP_CONFIG = {

  // ── Identidad de marca ──────────────────────────────
  brandName: 'La Visual Mk',
  panelSubtitle: 'Admin CRM',          // texto chico al lado del nombre en el header
  logoUrl: 'https://lavisualmk.alastecno.com/lavisual.png',
  creditUrl: 'https://lavisualmk.alastecno.com',
  blogUrl: 'https://lavisualmk.alastecno.com/admin/adminblog.html', // dejar '' si el cliente no tiene blog
  formularioClientesUrl: 'https://lavisualmk.alastecno.com/formulario-clientes.html', // a donde redirige el popup al cerrarse

  // ── Supabase ─────────────────────────────────────────
  supabaseUrl: 'https://redaqqxoeciycqgjhpbv.supabase.co',
  // ⚠️ IMPORTANTE: esto debe ser la ANON KEY (Settings → API → anon/public),
  // NUNCA la service_role key. La anon key respeta tus políticas RLS;
  // la service_role key se salta TODAS las RLS y le da a cualquiera que
  // vea el código fuente acceso total de lectura/escritura a toda la base.
  // Esta es tu anon key real (no la service_role que estaba antes en el código):
  supabaseAnonKey: 'sb_publishable_XYeljNeSm2awnovoTvzXiQ_va4cFyvU',

  // ── OneSignal (notificaciones push) ──────────────────
  oneSignalAppId: '',           // App ID público (si el cliente lo usa en su sitio)
  oneSignalAdminAppId: '8e742c8b-a42d-4aa8-b8f4-803ac2433b21',   // App ID para alertas internas del admin
  // ⚠️ La REST API Key de OneSignal NUNCA va acá. Es una clave de servidor:
  // con ella se pueden mandar pushes a toda la base de suscriptores o leer
  // sus datos. Vive como variable de entorno (ONESIGNAL_API_KEY) en la
  // Edge Function 'notify-new-client' de Supabase, no en este archivo.
  serviceWorkerPath: '/admin/OneSignalSDKWorker.js',
  serviceWorkerScope: '/admin/',

  // ── Paleta de colores (se aplica automáticamente a las variables CSS) ──
  colors: {
    bg: '#0f1117',
    surface: '#1a1d27',
    surface2: '#22263a',
    border: '#2e3250',
    accent: '#c8985a',
    accent2: '#e0b578',
    text: '#e8e6f0',
    muted: '#7a7d9a',
  },
};

/* ── Aplica la config a la página: título, textos de marca y colores ── */
(function aplicarConfig() {
  document.title = `Admin · ${APP_CONFIG.brandName}`;

  const root = document.documentElement.style;
  Object.entries(APP_CONFIG.colors).forEach(([k, v]) => root.setProperty(`--${k}`, v));

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.login-logo, .js-brand-name')
      .forEach(el => el.textContent = APP_CONFIG.brandName);

    const sub = document.querySelector('.js-brand-sub');
    if (sub) sub.textContent = `· ${APP_CONFIG.panelSubtitle}`;

    const blog = document.querySelector('.js-blog-link');
    if (blog) {
      if (APP_CONFIG.blogUrl) blog.href = APP_CONFIG.blogUrl;
      else blog.style.display = 'none';
    }

    const credit = document.querySelector('.js-credit-link');
    if (credit) credit.href = APP_CONFIG.creditUrl;

    const logo = document.querySelector('.js-credit-logo');
    if (logo) { logo.src = APP_CONFIG.logoUrl; logo.alt = APP_CONFIG.brandName; }
  });
})();
