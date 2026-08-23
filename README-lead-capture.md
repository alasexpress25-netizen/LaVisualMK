# lead-capture.js + submit-lead — Guía de uso

## Qué es esto

`lead-capture.js` reemplaza el código de tracking/popup/formulario que
tenías repetido e inseguro en el `index.html` público. Hace lo mismo,
pero sin exponer ninguna clave sensible en el navegador.

`submit-lead` es una Edge Function (ya desplegada en tu proyecto
`redaqqxoeciycqgjhpbv`) que guarda el lead del lado del servidor con
permisos elevados. El navegador nunca ve esa clave — solo le manda un
POST con los datos del formulario.

## ⚠️ Acción urgente en TU sitio actual (no es para el cliente nuevo, es para hoy)

Tu `index.html` público (lavisualmk.alastecno.com) tiene la
**service_role key** de Supabase escrita en el `<script>` cerca del
final del archivo (`LV_SUPABASE_SERVICE`). Cualquiera que visite la
página, sin loguearse ni nada, descarga esa clave junto con el resto
del JS. Es acceso total de lectura/escritura a toda tu base.

Dos pasos, en este orden:

1. **Rotar la key ya:** Supabase → tu proyecto → Settings → API →
   `service_role` → "Generate new key" (o el botón de rotar que
   aparezca). Esto invalida la clave vieja en todos lados al instante.
2. **Reemplazar el bloque viejo** en tu `index.html` público:
   - Borrar el `<script>` que define `LV_SUPABASE_URL`,
     `LV_SUPABASE_SERVICE`, `lvSb`, y la función `submitContacto()`
     completa (todo el bloque de "CONFIGURAÇÃO SUPABASE" hasta el
     cierre de `submitContacto`).
   - Borrar también el `<script>` de "Tracking de clicks" (el que
     tiene `SUPA_URL`/`SUPA_KEY` hardcodeados).
   - En su lugar, agregar antes de `</body>`:
     ```html
     <script src="config.js"></script>
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="lead-capture.js"></script>
     ```
   - El botón del formulario de contacto sigue llamando
     `onclick="submitContacto()"` — no hay que tocar el HTML del
     formulario, solo el JS.

## Cómo usarlo en un cliente nuevo

1. Copiar `config.js`, `lead-capture.js` al sitio del cliente.
2. Completar en `config.js`: `supabaseUrl`, `supabaseAnonKey` (la
   anon, nunca la service_role) y `formularioClientesUrl` si aplica.
3. Desplegar la Edge Function `submit-lead` en el proyecto Supabase
   de ese cliente (mismo código, no cambia nada por cliente —
   `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` se las inyecta
   Supabase automáticamente, no hay que configurar nada a mano).
4. En el HTML del sitio, usar estos `id`/atributos para que el script
   los encuentre solo:
   - `data-track="nombre-del-boton"` en cualquier link/botón que
     quieras trackear.
   - `#lead-overlay`, `#lead-form-area`, `#lead-success`,
     `#lead-confirm-close` para el popup (mismo markup que ya tenés).
   - `#cf-nome #cf-email #cf-empresa #cf-mensagem #cf-msg #cf-btn`
     para el formulario de contacto, con `onclick="submitContacto()"`
     en el botón.
5. Cargar en este orden, antes de `</body>`:
   ```html
   <script src="config.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="lead-capture.js"></script>
   ```

## Por qué la Edge Function y no llamar a Supabase directo

Guardar un lead nuevo está bien hacerlo con la anon key (insert simple).
El problema es cuando alguien manda el formulario *dos veces* con el
mismo email — ahí hace falta actualizar la fila existente (upsert), y
la anon key no tiene permiso de UPDATE en `clientes` (a propósito, ver
`schema.sql`). La Edge Function resuelve esto: corre con permisos de
servidor, así que puede hacer el upsert sin que el navegador necesite
una clave peligrosa.
