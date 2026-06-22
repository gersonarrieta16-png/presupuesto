/* ============================================================
   MATRIZ FINANCIERA FAMILIAR — script.js
   Gerson Arrieta · Saudith Reyes · A.S.T. Arrieta Soluciones
   ============================================================ */

const STORAGE_KEY = 'mff_v1';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];
const AÑOS = [2024, 2025, 2026, 2027, 2028];

/* ── DATOS BASE ─────────────────────────────────────────────
   editM: el monto es editable manualmente
   editP: el % Gerson es editable
   Si editP es false, el porcentaje se muestra fijo (sin input)
   ────────────────────────────────────────────────────────── */
const FILAS_BASE = [
  {
    id:1, rubro:'Pago de la casa',
    monto:1500000, vence:'Día 19',
    pG:50, estado:'Pendiente',
    nota:'', editM:false, editP:true
  },
  {
    id:2, rubro:'Alimentación',
    monto:1400000, vence:'Mensual',
    pG:50, estado:'Pendiente',
    nota:'', editM:false, editP:true
  },
  {
    id:3, rubro:'Refuerzos de Ian',
    monto:240000, vence:'Mensual',
    pG:50, estado:'Pendiente',
    nota:'$12.000 × 20 días hábiles', editM:false, editP:true
  },
  {
    id:4, rubro:'Transporte de Ian',
    monto:150000, vence:'Día 5',
    pG:50, estado:'Pendiente',
    nota:'', editM:false, editP:true
  },
  {
    id:5, rubro:'Cuidadora Valentina',
    monto:144000, vence:'Mensual',
    pG:50, estado:'Pendiente',
    nota:'$12.000 × 3 días/sem × 4 sem', editM:false, editP:true
  },
  {
    id:6, rubro:'Cuidadora María Liliana',
    monto:200000, vence:'Mensual',
    pG:50, estado:'Pendiente',
    nota:'', editM:false, editP:true
  },
  {
    id:7, rubro:'Internet',
    monto:85000, vence:'Día 14',
    pG:50, estado:'Pendiente',
    nota:'', editM:false, editP:true
  },
  {
    id:8, rubro:'Universidad Saudith',
    monto:null, vence:'Manual',
    pG:0, estado:'Pendiente',
    nota:'Ingresar monto manualmente →', editM:true, editP:true
  },
  {
    id:9, rubro:'Universidad Gerson',
    monto:0, vence:'N/A',
    pG:100, estado:'Gratuidad',
    nota:'Gratuidad aplicada', editM:false, editP:false
  },
];

/* ── ESTADO GLOBAL ──────────────────────────────────────── */
const hoy = new Date();
let estado = {
  mes:   hoy.getMonth(),
  año:   hoy.getFullYear(),
  filas: [],
};

/* ── PERSISTENCIA ───────────────────────────────────────── */
function guardar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mes:   estado.mes,
      año:   estado.año,
      filas: estado.filas.map(({ id, monto, pG, estado: est }) =>
        ({ id, monto, pG, estado: est })
      ),
    }));
    const b = document.getElementById('badge-save');
    if (b) { b.style.opacity = '1'; setTimeout(() => b.style.opacity = '.4', 1200); }
  } catch (e) {
    console.warn('No se pudo guardar en localStorage:', e);
  }
}

function cargar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('vacío');
    const g = JSON.parse(raw);
    estado.mes = (g.mes !== undefined) ? g.mes : estado.mes;
    estado.año = (g.año !== undefined) ? g.año : estado.año;
    // Merge: preserva solo los campos variables (monto, pG, estado)
    estado.filas = FILAS_BASE.map(base => {
      const guardada = (g.filas || []).find(f => f.id === base.id);
      if (!guardada) return { ...base };
      return {
        ...base,
        monto:  guardada.monto  !== undefined ? guardada.monto  : base.monto,
        pG:     guardada.pG     !== undefined ? guardada.pG     : base.pG,
        estado: guardada.estado !== undefined ? guardada.estado : base.estado,
      };
    });
  } catch {
    estado.filas = FILAS_BASE.map(f => ({ ...f }));
  }
}

/* ── FORMATEO ───────────────────────────────────────────── */
const cop = v => {
  if (v === null || v === undefined || v === '' || isNaN(+v)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(+v);
};

/* ── CÁLCULOS ───────────────────────────────────────────── */
function calcTotales() {
  const validas = estado.filas.filter(f =>
    f.monto !== null && f.monto !== '' && !isNaN(+f.monto)
  );
  return {
    monto:   validas.reduce((s, f) => s + +f.monto, 0),
    gerson:  validas.reduce((s, f) => s + +f.monto *  f.pG       / 100, 0),
    saudith: validas.reduce((s, f) => s + +f.monto * (100 - f.pG) / 100, 0),
  };
}

/* ── RENDER: SELECTORES ─────────────────────────────────── */
function renderSelectores() {
  const selM = document.getElementById('sel-month');
  const selA = document.getElementById('sel-year');

  selM.innerHTML = MESES
    .map((m, i) => `<option value="${i}" ${i === estado.mes ? 'selected' : ''}>${m}</option>`)
    .join('');
  selA.innerHTML = AÑOS
    .map(a => `<option value="${a}" ${a === estado.año ? 'selected' : ''}>${a}</option>`)
    .join('');

  selM.onchange = e => { estado.mes = +e.target.value; guardar(); };
  selA.onchange = e => { estado.año = +e.target.value; guardar(); };
}

/* ── RENDER: CARDS ──────────────────────────────────────── */
function renderCards() {
  const tot     = calcTotales();
  const pagadas = estado.filas.filter(f => f.estado === 'Pagado').length;
  const total   = estado.filas.filter(f => f.estado !== 'Gratuidad').length;
  const progPct = total > 0 ? Math.round(pagadas / total * 100) : 0;
  const pctG    = tot.monto > 0 ? Math.round(tot.gerson  / tot.monto * 100) : 0;
  const pctS    = tot.monto > 0 ? Math.round(tot.saudith / tot.monto * 100) : 0;

  document.getElementById('cards').innerHTML = `
    <div class="card c-total">
      <div class="card-lbl">Total pasivos del mes</div>
      <div class="card-val">${cop(tot.monto)}</div>
      <div class="card-sub">${pagadas} de ${total} ítems pagados (${progPct}%)</div>
      <div class="card-prog"><div class="card-fill" style="width:${progPct}%"></div></div>
    </div>
    <div class="card c-g">
      <div class="card-lbl">Aporte Gerson</div>
      <div class="card-val">${cop(tot.gerson)}</div>
      <div class="card-sub">${pctG}% del total mensual</div>
    </div>
    <div class="card c-s">
      <div class="card-lbl">Aporte Saudith</div>
      <div class="card-val">${cop(tot.saudith)}</div>
      <div class="card-sub">${pctS}% del total mensual</div>
    </div>
  `;
}

/* ── RENDER: TABLA ──────────────────────────────────────── */
function renderTabla() {
  const tot  = calcTotales();
  const tbody = document.getElementById('tbody');
  const tfoot = document.getElementById('tfoot');

  tbody.innerHTML = estado.filas.map(f => {
    const pS = 100 - f.pG;
    const m  = (f.monto !== null && f.monto !== '' && !isNaN(+f.monto)) ? +f.monto : null;
    const aG = m !== null ? m * f.pG / 100 : null;
    const aS = m !== null ? m * pS  / 100  : null;

    /* ── Celda Monto ── */
    const celdaMonto = f.editM
      ? `<input
           type="number" class="inp-monto"
           min="0" step="1000" placeholder="Ingresar..."
           value="${f.monto ?? ''}"
           aria-label="Monto Universidad Saudith"
           onchange="actualizarFila(${f.id}, 'monto', this.value === '' ? null : +this.value)"
         >`
      : `<strong>${cop(m)}</strong>`;

    /* ── Celda % Gerson ── */
    const celdaPctG = f.editP === false
      ? `${f.pG}%`
      : `<div class="pct-wrap">
           <input
             type="number" class="inp-pct"
             min="0" max="100" step="5"
             value="${f.pG}"
             aria-label="Porcentaje Gerson para ${f.rubro}"
             onchange="actualizarFila(${f.id}, 'pG', Math.min(100, Math.max(0, +this.value || 0)))"
           >
           <span class="pct-sym">%</span>
         </div>`;

    /* ── Celda Estado ── */
    const esGratuidad = f.estado === 'Gratuidad';
    const celdaEstado = esGratuidad
      ? `<span class="badge-gratuidad">Gratuidad</span>`
      : `<select
           class="estado estado-${f.estado === 'Pagado' ? 'pagado' : 'pendiente'}"
           aria-label="Estado de ${f.rubro}"
           onchange="actualizarFila(${f.id}, 'estado', this.value)"
         >
           <option ${f.estado === 'Pendiente' ? 'selected' : ''} value="Pendiente">⏳ Pendiente</option>
           <option ${f.estado === 'Pagado'    ? 'selected' : ''} value="Pagado">✅ Pagado</option>
         </select>`;

    return `
      <tr>
        <td>
          <span class="rubro-name">${f.rubro}</span>
          ${f.nota ? `<span class="rubro-note">${f.nota}</span>` : ''}
        </td>
        <td class="td-monto">${celdaMonto}</td>
        <td class="td-vence">${f.vence}</td>
        <td class="td-pct-g">${celdaPctG}</td>
        <td class="td-pct-s">${pS}%</td>
        <td class="td-aporte-g">${cop(aG)}</td>
        <td class="td-aporte-s">${cop(aS)}</td>
        <td class="td-estado">${celdaEstado}</td>
      </tr>
    `;
  }).join('');

  tfoot.innerHTML = `
    <tr>
      <td class="tf-label">TOTALES</td>
      <td class="tf-monto">${cop(tot.monto)}</td>
      <td colspan="3" class="tf-dash">—</td>
      <td class="tf-g">${cop(tot.gerson)}</td>
      <td class="tf-s">${cop(tot.saudith)}</td>
      <td class="tf-dash">—</td>
    </tr>
  `;
}

/* ── RENDER COMPLETO ────────────────────────────────────── */
function render() {
  renderSelectores();
  renderCards();
  renderTabla();
}

/* ── ACTUALIZAR FILA ────────────────────────────────────── */
/**
 * Actualiza un campo de una fila por id, guarda en localStorage
 * y re-renderiza cards + tabla.
 * @param {number} id     - id de la fila
 * @param {string} campo  - campo a actualizar ('monto', 'pG', 'estado')
 * @param {*}      valor  - nuevo valor
 */
function actualizarFila(id, campo, valor) {
  estado.filas = estado.filas.map(f =>
    f.id === id ? { ...f, [campo]: valor } : f
  );
  guardar();
  renderCards();
  renderTabla();
}

/* ── REINICIAR DATOS ────────────────────────────────────── */
function resetData() {
  const mes  = MESES[estado.mes];
  const año  = estado.año;
  const ok = confirm(
    `¿Reiniciar todos los datos de ${mes} ${año}?\n\n` +
    'Se restaurarán los estados a "Pendiente", los porcentajes al 50/50 ' +
    'y se borrará el monto de Universidad Saudith.\n\nEsta acción no se puede deshacer.'
  );
  if (!ok) return;
  estado.filas = FILAS_BASE.map(f => ({ ...f }));
  guardar();
  render();
}

/* ── EVENTOS FIJOS ──────────────────────────────────────── */
document.getElementById('btn-print').addEventListener('click', () => window.print());
document.getElementById('btn-reset').addEventListener('click', resetData);

/* ── INICIO ─────────────────────────────────────────────── */
cargar();
render();
