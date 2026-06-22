/* ============================================================
   MATRIZ FINANCIERA FAMILIAR — script.js  v2
   Gerson Arrieta · Saudith Reyes · A.S.T. Arrieta Soluciones
   ============================================================ */

const STORAGE_KEY = 'mff_v2';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];
const AÑOS = [2024, 2025, 2026, 2027, 2028];

/* ── DATOS BASE ─────────────────────────────────────────────
   Todos los campos son editables en la app.
   Estado: 'Pendiente' | 'Pagado' | 'Gratuidad'
   ────────────────────────────────────────────────────────── */
const FILAS_BASE = [
  { id:1, rubro:'Pago de la casa',         monto:1500000, vence:'Día 19',  pG:50,  estado:'Pendiente' },
  { id:2, rubro:'Alimentación',             monto:1400000, vence:'Mensual', pG:50,  estado:'Pendiente' },
  { id:3, rubro:'Refuerzos de Ian',         monto:240000,  vence:'Mensual', pG:50,  estado:'Pendiente' },
  { id:4, rubro:'Transporte de Ian',        monto:150000,  vence:'Día 5',   pG:50,  estado:'Pendiente' },
  { id:5, rubro:'Cuidadora Valentina',      monto:144000,  vence:'Mensual', pG:50,  estado:'Pendiente' },
  { id:6, rubro:'Cuidadora María Liliana',  monto:200000,  vence:'Mensual', pG:50,  estado:'Pendiente' },
  { id:7, rubro:'Internet',                 monto:85000,   vence:'Día 14',  pG:50,  estado:'Pendiente' },
  { id:8, rubro:'Universidad Saudith',      monto:0,       vence:'Manual',  pG:0,   estado:'Pendiente' },
  { id:9, rubro:'Universidad Gerson',       monto:0,       vence:'N/A',     pG:100, estado:'Gratuidad' },
];

let nextId = 10;

/* ── ESTADO GLOBAL ──────────────────────────────────────── */
const hoy = new Date();
let estado = {
  mes:   hoy.getMonth(),
  año:   hoy.getFullYear(),
  filas: [],
};

/* ── HELPERS ────────────────────────────────────────────── */
const cop = v => {
  if (v === null || v === undefined || v === '' || isNaN(+v)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(+v);
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, isNaN(+v) ? min : +v));

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function flashGuardado() {
  const b = document.getElementById('badge-save');
  if (!b) return;
  b.style.opacity = '1';
  clearTimeout(b._t);
  b._t = setTimeout(() => b.style.opacity = '.4', 1600);
}

/* ── PERSISTENCIA ───────────────────────────────────────── */
function guardar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mes: estado.mes, año: estado.año,
      nextId, filas: estado.filas,
    }));
    flashGuardado();
  } catch (e) {
    console.warn('No se pudo guardar:', e);
  }
}

function cargar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('vacío');
    const g = JSON.parse(raw);
    estado.mes = g.mes ?? estado.mes;
    estado.año = g.año ?? estado.año;
    nextId     = g.nextId ?? 10;
    const filas = g.filas || [];
    if (!filas.length) throw new Error('sin filas');
    estado.filas = filas.map(f => ({
      id:     +f.id,
      rubro:  String(f.rubro  || 'Ítem'),
      monto:  (!isNaN(+f.monto) && f.monto !== null) ? +f.monto : 0,
      vence:  String(f.vence  || 'Mensual'),
      pG:     clamp(f.pG, 0, 100),
      estado: ['Pendiente','Pagado','Gratuidad'].includes(f.estado) ? f.estado : 'Pendiente',
    }));
  } catch {
    estado.filas = FILAS_BASE.map(f => ({ ...f }));
    nextId = 10;
  }
}

/* ── CÁLCULOS ───────────────────────────────────────────── */
function calcTotales() {
  const v = estado.filas.filter(f => !isNaN(+f.monto));
  return {
    monto:   v.reduce((s, f) => s + +f.monto, 0),
    gerson:  v.reduce((s, f) => s + +f.monto *  f.pG        / 100, 0),
    saudith: v.reduce((s, f) => s + +f.monto * (100 - f.pG) / 100, 0),
  };
}

/* ── RENDER: SELECTORES ─────────────────────────────────── */
function renderSelectores() {
  const selM = document.getElementById('sel-month');
  const selA = document.getElementById('sel-year');
  selM.innerHTML = MESES.map((m, i) =>
    `<option value="${i}" ${i === estado.mes ? 'selected' : ''}>${m}</option>`).join('');
  selA.innerHTML = AÑOS.map(a =>
    `<option value="${a}" ${a === estado.año ? 'selected' : ''}>${a}</option>`).join('');
  selM.onchange = e => { estado.mes = +e.target.value; guardar(); };
  selA.onchange = e => { estado.año = +e.target.value; guardar(); };
}

/* ── RENDER: CARDS ──────────────────────────────────────── */
function renderCards() {
  const tot   = calcTotales();
  const pag   = estado.filas.filter(f => f.estado === 'Pagado').length;
  const total = estado.filas.filter(f => f.estado !== 'Gratuidad').length;
  const prog  = total > 0 ? Math.round(pag / total * 100) : 0;
  const pG    = tot.monto > 0 ? Math.round(tot.gerson  / tot.monto * 100) : 0;
  const pS    = tot.monto > 0 ? Math.round(tot.saudith / tot.monto * 100) : 0;

  document.getElementById('cards').innerHTML = `
    <div class="card c-total">
      <div class="card-lbl">Total pasivos</div>
      <div class="card-val">${cop(tot.monto)}</div>
      <div class="card-sub">${pag} de ${total} ítems pagados</div>
      <div class="card-prog"><div class="card-fill" style="width:${prog}%"></div></div>
    </div>
    <div class="card c-g">
      <div class="card-lbl">Aporte Gerson</div>
      <div class="card-val">${cop(tot.gerson)}</div>
      <div class="card-sub">${pG}% del total</div>
    </div>
    <div class="card c-s">
      <div class="card-lbl">Aporte Saudith</div>
      <div class="card-val">${cop(tot.saudith)}</div>
      <div class="card-sub">${pS}% del total</div>
    </div>
  `;
}

/* ── RENDER: TABLA ──────────────────────────────────────── */
function renderTabla() {
  const tot   = calcTotales();
  const tbody = document.getElementById('tbody');
  const tfoot = document.getElementById('tfoot');

  tbody.innerHTML = estado.filas.map(f => {
    const pS = 100 - f.pG;
    const aG = +f.monto *  f.pG / 100;
    const aS = +f.monto *  pS   / 100;
    const estadoCls = `estado estado-${f.estado.toLowerCase()}`;

    return `
    <tr data-id="${f.id}">
      <td class="td-rubro">
        <input type="text" class="inp-rubro"
               value="${escHtml(f.rubro)}"
               title="Clic para editar"
               onfocus="this.select()"
               onblur="actualizarTexto(${f.id}, 'rubro', this.value)"
               onkeydown="if(event.key==='Enter')this.blur()">
      </td>
      <td class="td-monto">
        <input type="number" class="inp-monto"
               value="${f.monto}" min="0" step="1000"
               onchange="actualizarNumero(${f.id}, 'monto', this.value===''?0:+this.value)">
      </td>
      <td class="td-vence">
        <input type="text" class="inp-vence"
               value="${escHtml(f.vence)}"
               onfocus="this.select()"
               onblur="actualizarTexto(${f.id}, 'vence', this.value)"
               onkeydown="if(event.key==='Enter')this.blur()">
      </td>
      <td class="td-pct-g">
        <div class="pct-wrap">
          <input type="number" class="inp-pct"
                 value="${f.pG}" min="0" max="100" step="5"
                 onchange="actualizarNumero(${f.id}, 'pG', Math.min(100, Math.max(0, +this.value||0)))">
          <span class="pct-sym">%</span>
        </div>
      </td>
      <td class="td-pct-s">${pS}%</td>
      <td class="td-aporte-g">${cop(aG)}</td>
      <td class="td-aporte-s">${cop(aS)}</td>
      <td class="td-estado">
        <select class="${estadoCls}" data-id="${f.id}"
                onchange="actualizarEstado(${f.id}, this.value)">
          <option ${f.estado==='Pendiente' ?'selected':''} value="Pendiente">⏳ Pendiente</option>
          <option ${f.estado==='Pagado'    ?'selected':''} value="Pagado"   >✅ Pagado</option>
          <option ${f.estado==='Gratuidad' ?'selected':''} value="Gratuidad">🎓 Gratuidad</option>
        </select>
      </td>
      <td class="td-del">
        <button class="btn-del" title="Eliminar ítem"
                onclick="eliminarFila(${f.id})" aria-label="Eliminar ${escHtml(f.rubro)}">✕</button>
      </td>
    </tr>`;
  }).join('');

  /* TOTALES — 9 columnas: 1 + 1 + 3(colspan) + 1 + 1 + 2(colspan) */
  tfoot.innerHTML = `
    <tr>
      <td class="tf-label">TOTALES</td>
      <td class="tf-monto">${cop(tot.monto)}</td>
      <td colspan="3" class="tf-dash">—</td>
      <td class="tf-g">${cop(tot.gerson)}</td>
      <td class="tf-s">${cop(tot.saudith)}</td>
      <td colspan="2" class="tf-dash">—</td>
    </tr>
  `;
}

/* ── RENDER COMPLETO ────────────────────────────────────── */
function render() {
  renderSelectores();
  renderCards();
  renderTabla();
}

/* ── ACTUALIZAR CAMPOS ──────────────────────────────────── */

/**
 * Texto (rubro, vence): solo actualiza estado y guarda.
 * NO re-renderiza para no interrumpir el foco del usuario.
 */
function actualizarTexto(id, campo, valor) {
  const v = valor.trim();
  estado.filas = estado.filas.map(f =>
    f.id === id ? { ...f, [campo]: v || f[campo] } : f
  );
  guardar();
}

/**
 * Numérico (monto, pG): actualiza estado y re-renderiza
 * para recalcular aportes y totales.
 */
function actualizarNumero(id, campo, valor) {
  estado.filas = estado.filas.map(f =>
    f.id === id ? { ...f, [campo]: +valor } : f
  );
  guardar();
  renderCards();
  renderTabla();
}

/**
 * Estado: actualiza estado, re-renderiza cards y solo
 * cambia la clase CSS del select (sin re-render completo de la tabla).
 */
function actualizarEstado(id, valor) {
  estado.filas = estado.filas.map(f =>
    f.id === id ? { ...f, estado: valor } : f
  );
  guardar();
  renderCards();
  /* Actualizar solo la clase del select, preservando el foco en otros inputs */
  const sel = document.querySelector(`select.estado[data-id="${id}"]`);
  if (sel) sel.className = `estado estado-${valor.toLowerCase()}`;
}

/* ── AGREGAR FILA ───────────────────────────────────────── */
function agregarFila() {
  estado.filas.push({
    id:     nextId++,
    rubro:  'Nuevo ítem',
    monto:  0,
    vence:  'Mensual',
    pG:     50,
    estado: 'Pendiente',
  });
  guardar();
  renderCards();
  renderTabla();
  /* Foco automático en el nombre del nuevo ítem */
  setTimeout(() => {
    const inputs = document.querySelectorAll('.inp-rubro');
    const last = inputs[inputs.length - 1];
    if (last) { last.focus(); last.select(); }
  }, 40);
}

/* ── ELIMINAR FILA ──────────────────────────────────────── */
function eliminarFila(id) {
  if (estado.filas.length <= 1) {
    alert('Debe haber al menos un ítem en la lista.');
    return;
  }
  const fila = estado.filas.find(f => f.id === id);
  if (!fila) return;
  if (!confirm(`¿Eliminar el ítem "${fila.rubro}"?\n\nEsta acción no se puede deshacer.`)) return;
  estado.filas = estado.filas.filter(f => f.id !== id);
  guardar();
  renderCards();
  renderTabla();
}

/* ── REINICIAR ──────────────────────────────────────────── */
function resetData() {
  if (!confirm(
    '¿Reiniciar completamente los datos?\n\n' +
    'Se restaurarán los ítems originales con sus valores predeterminados. ' +
    'Esta acción no se puede deshacer.'
  )) return;
  estado.filas = FILAS_BASE.map(f => ({ ...f }));
  nextId = 10;
  guardar();
  render();
}

/* ── EVENTOS ────────────────────────────────────────────── */
document.getElementById('btn-print').addEventListener('click', () => window.print());
document.getElementById('btn-reset').addEventListener('click', resetData);
document.getElementById('btn-add').addEventListener('click', agregarFila);

/* ── INICIO ─────────────────────────────────────────────── */
cargar();
render();
