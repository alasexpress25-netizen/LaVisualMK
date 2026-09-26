// js/content-plan.js
// Generado automaticamente al modularizar agencia/index.html.
// No se cambio ninguna logica: solo se movio codigo de lugar y se
// agregaron los import/export necesarios para que funcione como
// modulo ES nativo (<script type="module">).

import { planViewMode, sb } from "./state.js";
import { loadClients } from "./app.js";
import { hashtagsToArray } from "./hashtags.js";

function setPlanView(clientId, mode){
  planViewMode[clientId] = mode;
  const listEl = document.getElementById(`planListView-${clientId}`);
  const calEl = document.getElementById(`planCalView-${clientId}`);
  const histEl = document.getElementById(`planHistView-${clientId}`);
  if(listEl) listEl.style.display = mode === 'list' ? 'block' : 'none';
  if(calEl) calEl.style.display = mode === 'calendar' ? 'block' : 'none';
  if(histEl) histEl.style.display = mode === 'history' ? 'block' : 'none';
  document.querySelectorAll(`[data-plan-toggle="${clientId}"] button`).forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
}
// Historial de items ya decididos (aprobados/rechazados) para el plan
// semanal: de solo lectura, sin botones de accion -- si la agencia se
// arrepiente de un rechazo, edita/reactiva el item directo en Supabase,
// esto es solo para consultar que paso.
function buildPlanHistoryHtml(historyItems){
  if(!(historyItems||[]).length){
    return '<div class="meta-row" style="margin-top:8px;">Todavía no hay posts aprobados ni rechazados para este cliente.</div>';
  }
  return historyItems.map(item => `
    <div class="card" style="margin-top:8px; opacity:0.85;">
      <div class="meta-row" style="margin-bottom:6px;">
        <strong>${new Date(item.target_date + 'T00:00:00').toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'short' })}</strong>
        ${item.angle ? ` · <span class="pill">${item.angle}</span>` : ''}
        · <span class="pill ${item.status === 'approved' ? '' : 'off'}">${item.status === 'approved' ? '✅ aprobado' : '❌ rechazado'}</span>
        ${item.reviewed_at ? ` <span style="font-size:11px; color:var(--muted);">· decidido el ${new Date(item.reviewed_at).toLocaleDateString('es-AR')}</span>` : ''}
      </div>
      <div class="meta-row" style="white-space:pre-wrap;">${(item.caption||'sin texto').replace(/</g,'&lt;')}</div>
      ${hashtagsToArray(item.hashtags).length ? `<div class="hashtag-row" style="margin-top:6px;">${hashtagsToArray(item.hashtags).map(t => `<span class="hashtag-chip" style="padding:3px 12px;">${t}</span>`).join('')}</div>` : ''}
    </div>
  `).join('');
}
// Arma una grilla lunes-a-domingo con los items del plan ubicados en su
// dia (target_date). Es un resumen visual, de solo lectura -- para editar
// texto/hashtags o aprobar/rechazar se usa la vista de lista de siempre.
function buildPlanCalendarHtml(planItems){
  const dayNames = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const byDay = Array.from({ length: 7 }, () => []);
  (planItems||[]).forEach(item => {
    const d = new Date(item.target_date + 'T00:00:00');
    const dow = (d.getDay() + 6) % 7; // lunes=0 ... domingo=6
    byDay[dow].push(item);
  });
  return `
    <div class="plan-calendar">
      ${dayNames.map((name, i) => `
        <div class="plan-cal-day">
          <div class="plan-cal-day-label">${name}</div>
          ${byDay[i].length ? byDay[i].map(item => `
            <div class="plan-cal-item ${item.status === 'approved' ? 'approved' : ''}" title="${(item.caption||'').replace(/"/g,'&quot;')}">
              <span class="plan-cal-item-angle">${item.angle || new Date(item.target_date + 'T00:00:00').toLocaleDateString('es-AR', { day:'numeric', month:'short' })} ${item.status === 'approved' ? '✅' : '⏳'}</span>
              ${(item.caption || '').slice(0, 50)}${(item.caption||'').length > 50 ? '…' : ''}
            </div>
          `).join('') : '<span class="meta-row" style="margin-top:0; font-size:11px;">—</span>'}
        </div>
      `).join('')}
    </div>`;
}
// ---------------------------------------------------------------------------
// FASE 6: revisar (editar/aprobar/rechazar) items del plan semanal de
// contenido generado por IA (scheduler/content_planner.py). Mismo criterio
// de RLS que el resto del panel de agencia: "owner sees own
// content_plan_items" (0013_content_plan.sql) le da UPDATE directo, sin
// necesitar ninguna función RPC.
// ---------------------------------------------------------------------------
async function saveContentPlanItem(itemId){
  const caption = document.getElementById(`plan-caption-${itemId}`).value;
  const hashtagsField = document.getElementById(`plan-hashtags-${itemId}`);
  const hashtags = hashtagsField ? hashtagsField.value : undefined;
  const { error } = await sb.from('socialbot_content_plan_items').update({ caption, hashtags }).eq('id', itemId);
  if(error){ alert(error.message); return; }
  alert('Texto y hashtags guardados.');
}
async function reviewContentPlanItem(itemId, status){
  const patch = { status, reviewed_at: new Date().toISOString() };
  const { error } = await sb.from('socialbot_content_plan_items').update(patch).eq('id', itemId);
  if(error){ alert(error.message); return; }
  loadClients();
}

export { buildPlanCalendarHtml, buildPlanHistoryHtml, reviewContentPlanItem, saveContentPlanItem, setPlanView };

// Exposicion a window: estas funciones se llaman desde atributos
// onclick="..." embebidos en HTML generado dinamicamente (renderPostsList,
// renderArchivosHostRow, etc). Los modulos ES no exponen sus funciones al
// scope global por default, asi que hace falta este puente explicito.
window.reviewContentPlanItem = reviewContentPlanItem;
window.saveContentPlanItem = saveContentPlanItem;
window.setPlanView = setPlanView;
