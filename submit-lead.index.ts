import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ════════════════════════════════════════════════════════════
   submit-lead
   Recibe un lead público (popup / formulario de contacto) y lo
   guarda en `clientes` usando la service_role key del LADO DEL
   SERVIDOR. El navegador nunca ve esta clave: solo le pega a
   esta URL con fetch() y manda los datos del formulario.
   ════════════════════════════════════════════════════════════ */

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // ya la inyecta Supabase solo, no hay que configurarla

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  try {
    const body = await req.json();

    const nombre  = String(body.nombre  || "").trim();
    const email   = String(body.email   || "").trim().toLowerCase();
    const telefono = String(body.telefono || "").trim();
    const fuente  = String(body.fuente  || "formulario_web").trim();
    const notas   = String(body.notas   || "").trim();
    const descuento = body.descuento ? String(body.descuento).trim() : null;
    const consent_datos  = !!body.consent_datos;
    const consent_imagen = !!body.consent_imagen;

    // Validación básica del lado del servidor (no confiar solo en el front)
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    if (!nombre || !emailValido) {
      return json({ error: "Nombre o email inválido" }, 400);
    }

    const sb = createClient(SB_URL, SB_KEY);
    const { error } = await sb
      .from("clientes")
      .upsert(
        {
          nombre,
          email,
          telefono,
          estado: "Lead",
          fuente,
          notas,
          descuento,
          consent_datos,
          consent_imagen,
        },
        { onConflict: "email", ignoreDuplicates: false }
      );

    if (error) {
      console.error("submit-lead error:", error.message);
      return json({ error: "No se pudo guardar el lead" }, 500);
    }

    return json({ ok: true });

  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
