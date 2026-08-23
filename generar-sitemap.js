/**
 * ╔══════════════════════════════════════════════════════════╗
 *   GENERADOR DE SITEMAP — LaVisualMk / Impacto 3D Mídia
 *   
 *   Busca todos los artículos publicados en Supabase y genera
 *   un sitemap.xml completo listo para subir al servidor.
 *
 *   Uso:
 *     node generar-sitemap.js
 *
 *   Requisito:
 *     node 18+ (usa fetch nativo) — o instalar: npm install node-fetch
 * ╚══════════════════════════════════════════════════════════╝
 */

const fs = require('fs');

// ── CONFIGURACIÓN ─────────────────────────────────────────
const SB_URL  = 'https://redaqqxoeciycqgjhpbv.supabase.co';
// ⚠️ anon key (no service_role) — este script solo LEE artículos activos
// (select=slug,fecha&activo=eq.true), y esa lectura ya está permitida para
// "anon" por la política RLS pública de blog_posts. No hace falta la key
// que se salta todas las políticas.
const SB_KEY  = 'sb_publishable_XYeljNeSm2awnovoTvzXiQ_va4cFyvU';
const DOMAIN  = 'https://lavisualmk.alastecno.com';
const HOY     = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
// ──────────────────────────────────────────────────────────

// Páginas estáticas siempre presentes
const PAGINAS_ESTATICAS = [
  { url: `${DOMAIN}/`,                   changefreq: 'monthly', priority: '1.0' },
  { url: `${DOMAIN}/impacto3d.html`,     changefreq: 'monthly', priority: '0.8' },
  { url: `${DOMAIN}/blog.html`,          changefreq: 'weekly',  priority: '0.8' },
  // formulario-clientes.html está excluido (noindex)
];

async function fetchArticulos() {
  const resp = await fetch(
    `${SB_URL}/rest/v1/blog_posts?select=slug,fecha&activo=eq.true&order=fecha.desc`,
    {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
      }
    }
  );

  if (!resp.ok) {
    console.error(`❌ Error Supabase: ${resp.status} ${resp.statusText}`);
    process.exit(1);
  }

  return await resp.json();
}

function generarXML(articulos) {
  const urlsEstaticas = PAGINAS_ESTATICAS.map(p => `
  <url>
    <loc>${p.url}</loc>
    <lastmod>${HOY}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

  const urlsArticulos = articulos.map(a => {
    const fecha = a.fecha || HOY;
    return `
  <url>
    <loc>${DOMAIN}/blog-articulo.html?slug=${encodeURIComponent(a.slug)}</loc>
    <lastmod>${fecha}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsEstaticas}
${urlsArticulos}
</urlset>`;
}

async function main() {
  console.log('🔍 Buscando artigos em Supabase...');
  const articulos = await fetchArticulos();
  console.log(`✅ ${articulos.length} artigo(s) encontrado(s)`);

  const xml = generarXML(articulos);
  fs.writeFileSync('sitemap.xml', xml, 'utf8');

  console.log(`📄 sitemap.xml generado con ${PAGINAS_ESTATICAS.length + articulos.length} URLs`);
  console.log('');
  console.log('📋 Próximos pasos:');
  console.log('   1. Subir el sitemap.xml a la raíz del servidor');
  console.log('   2. Ir a Google Search Console → Sitemaps');
  console.log(`   3. Pegar: ${DOMAIN}/sitemap.xml`);
  console.log('   4. Clic en "Enviar"');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
