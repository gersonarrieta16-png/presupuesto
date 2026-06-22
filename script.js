/* ============================================================
   MATRIZ FINANCIERA FAMILIAR — script.js  v3
   Gerson Arrieta · Saudith Reyes · A.S.T.
   ============================================================ */

const STORAGE_KEY = 'mff_v3';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const ANOS  = [2024, 2025, 2026, 2027, 2028];

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
const hoy  = new Date();

let st = {
  mes:   hoy.getMonth(),
  ano:   hoy.getFullYear(),
  filas: [],
};

/* ── HELPERS ── */
function cop(v) {
  if (v === null || v === undefined || v === '' || isNaN(+v)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(+v);
}

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/"/g,'&quot;')
    .replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function clamp(v, a, b) {
  var n = +v;
  return isNaN(n) ? a : Math.min(b, Math.max(a, n));
}

function flash() {
  var b = document.getElementById('badge-save');
  if (!b) return;
  b.style.opacity = '1';
  clearTimeout(b._t);
  b._t = setTimeout(function() { b.style.opacity = '.4'; }, 1600);
}

/* ── PERSISTENCIA ── */
function guardar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mes: st.mes, ano: st.ano, nextId: nextId, filas: st.filas
    }));
    flash();
  } catch(e) { console.warn('localStorage:', e); }
}

function cargar() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw 0;
    var g = JSON.parse(raw);
    st.mes   = (g.mes !== undefined) ? g.mes : st.mes;
    st.ano   = (g.ano !== undefined) ? g.ano : st.ano;
    nextId   = g.nextId || 10;
    var ff   = g.filas || [];
    if (!ff.length) throw 0;
    st.filas = ff.map(function(f) {
      return {
        id:     +f.id || 0,
        rubro:  String(f.rubro  || 'Ítem'),
        monto:  (!isNaN(+f.monto) && f.monto !== null) ? +f.monto : 0,
        vence:  String(f.vence  || 'Mensual'),
        pG:     clamp(f.pG, 0, 100),
        estado: ['Pendiente','Pagado','Gratuidad'].indexOf(f.estado) >= 0 ? f.estado : 'Pendiente',
      };
    });
  } catch(e) {
    st.filas = FILAS_BASE.map(function(f) { return Object.assign({}, f); });
    nextId   = 10;
  }
}

/* ── CÁLCULOS ── */
function totales() {
  var monto = 0, gerson = 0, saudith = 0;
  st.filas.forEach(function(f) {
    var m = +f.monto;
    if (isNaN(m)) return;
    monto   += m;
    gerson  += m * f.pG / 100;
    saudith += m * (100 - f.pG) / 100;
  });
  return { monto: monto, gerson: gerson, saudith: saudith };
}

/* ── RENDER: SELECTORES ── */
function renderSel() {
  var selM = document.getElementById('sel-month');
  var selA = document.getElementById('sel-year');
  selM.innerHTML = MESES.map(function(m, i) {
    return '<option value="' + i + '"' + (i === st.mes ? ' selected' : '') + '>' + m + '</option>';
  }).join('');
  selA.innerHTML = ANOS.map(function(a) {
    return '<option value="' + a + '"' + (a === st.ano ? ' selected' : '') + '>' + a + '</option>';
  }).join('');
  selM.onchange = function(e) { st.mes = +e.target.value; guardar(); };
  selA.onchange = function(e) { st.ano = +e.target.value; guardar(); };
}

/* ── RENDER: CARDS ── */
function renderCards() {
  var tot   = totales();
  var pag   = st.filas.filter(function(f) { return f.estado === 'Pagado'; }).length;
  var total = st.filas.filter(function(f) { return f.estado !== 'Gratuidad'; }).length;
  var prog  = total > 0 ? Math.round(pag / total * 100) : 0;
  var pG    = tot.monto > 0 ? Math.round(tot.gerson  / tot.monto * 100) : 0;
  var pS    = tot.monto > 0 ? Math.round(tot.saudith / tot.monto * 100) : 0;
  document.getElementById('cards').innerHTML =
    '<div class="card c-total">' +
      '<div class="card-lbl">Total pasivos</div>' +
      '<div class="card-val">' + cop(tot.monto) + '</div>' +
      '<div class="card-sub">' + pag + ' de ' + total + ' ítems pagados</div>' +
      '<div class="card-prog"><div class="card-fill" style="width:' + prog + '%"></div></div>' +
    '</div>' +
    '<div class="card c-g">' +
      '<div class="card-lbl">Aporte Gerson</div>' +
      '<div class="card-val">' + cop(tot.gerson) + '</div>' +
      '<div class="card-sub">' + pG + '% del total</div>' +
    '</div>' +
    '<div class="card c-s">' +
      '<div class="card-lbl">Aporte Saudith</div>' +
      '<div class="card-val">' + cop(tot.saudith) + '</div>' +
      '<div class="card-sub">' + pS + '% del total</div>' +
    '</div>';
}

/* ── RENDER: TABLA ── */
function renderTabla() {
  var tot   = totales();
  var rows  = '';

  st.filas.forEach(function(f) {
    var pS  = 100 - f.pG;
    var aG  = +f.monto * f.pG / 100;
    var aS  = +f.monto * pS   / 100;
    var cls = 'estado estado-' + f.estado.toLowerCase();
    rows +=
      '<tr data-id="' + f.id + '">' +
        '<td class="td-rubro">' +
          '<input type="text" class="inp-rubro"' +
                 ' value="' + esc(f.rubro) + '"' +
                 ' data-id="' + f.id + '" data-campo="rubro"' +
                 ' onfocus="this.select()"' +
                 ' onblur="onTexto(this)"' +
                 ' onkeydown="if(event.key===\'Enter\')this.blur()">' +
        '</td>' +
        '<td class="td-monto">' +
          '<input type="number" class="inp-monto"' +
                 ' value="' + f.monto + '" min="0" step="1000"' +
                 ' data-id="' + f.id + '" data-campo="monto"' +
                 ' onchange="onNumero(this)">' +
        '</td>' +
        '<td class="td-vence">' +
          '<input type="text" class="inp-vence"' +
                 ' value="' + esc(f.vence) + '"' +
                 ' data-id="' + f.id + '" data-campo="vence"' +
                 ' onfocus="this.select()"' +
                 ' onblur="onTexto(this)"' +
                 ' onkeydown="if(event.key===\'Enter\')this.blur()">' +
        '</td>' +
        '<td class="td-pct-g">' +
          '<div class="pct-wrap">' +
            '<input type="number" class="inp-pct"' +
                   ' value="' + f.pG + '" min="0" max="100" step="5"' +
                   ' data-id="' + f.id + '" data-campo="pG"' +
                   ' onchange="onPct(this)">' +
            '<span class="pct-sym">%</span>' +
          '</div>' +
        '</td>' +
        '<td class="td-pct-s">' + pS + '%</td>' +
        '<td class="td-aporte-g">' + cop(aG) + '</td>' +
        '<td class="td-aporte-s">' + cop(aS) + '</td>' +
        '<td class="td-estado">' +
          '<select class="' + cls + '"' +
                  ' data-id="' + f.id + '"' +
                  ' onchange="onEstado(this)">' +
            '<option' + (f.estado === 'Pendiente'  ? ' selected' : '') + ' value="Pendiente">⏳ Pendiente</option>' +
            '<option' + (f.estado === 'Pagado'      ? ' selected' : '') + ' value="Pagado">✅ Pagado</option>' +
            '<option' + (f.estado === 'Gratuidad'   ? ' selected' : '') + ' value="Gratuidad">🎓 Gratuidad</option>' +
          '</select>' +
        '</td>' +
        '<td class="td-del">' +
          '<button class="btn-del" data-id="' + f.id + '" title="Eliminar" onclick="eliminar(this)">✕</button>' +
        '</td>' +
      '</tr>';
  });

  document.getElementById('tbody').innerHTML = rows;

  /* TFOOT — 9 columnas */
  document.getElementById('tfoot').innerHTML =
    '<tr>' +
      '<td class="tf-label">TOTALES</td>' +
      '<td class="tf-monto">' + cop(tot.monto) + '</td>' +
      '<td colspan="3" class="tf-dash">—</td>' +
      '<td class="tf-g">' + cop(tot.gerson) + '</td>' +
      '<td class="tf-s">' + cop(tot.saudith) + '</td>' +
      '<td colspan="2" class="tf-dash">—</td>' +
    '</tr>';
}

function render() {
  renderSel();
  renderCards();
  renderTabla();
}

/* ── HANDLERS DE EVENTOS ──
   Usan data-attributes en lugar de argumentos inline para
   evitar problemas de codificación con caracteres especiales.
   ─────────────────────────────────────────────────────────── */

/* Texto (rubro, vence): solo guarda, sin re-render */
function onTexto(el) {
  var id    = +el.dataset.id;
  var campo = el.dataset.campo;
  var val   = el.value.trim();
  st.filas = st.filas.map(function(f) {
    if (f.id !== id) return f;
    var copy = Object.assign({}, f);
    copy[campo] = val || f[campo];
    return copy;
  });
  guardar();
}

/* Numérico (monto): guarda y re-renderiza */
function onNumero(el) {
  var id  = +el.dataset.id;
  var val = el.value === '' ? 0 : +el.value;
  st.filas = st.filas.map(function(f) {
    if (f.id !== id) return f;
    return Object.assign({}, f, { monto: val });
  });
  guardar();
  renderCards();
  renderTabla();
}

/* % Gerson: guarda y re-renderiza */
function onPct(el) {
  var id  = +el.dataset.id;
  var val = clamp(el.value, 0, 100);
  st.filas = st.filas.map(function(f) {
    if (f.id !== id) return f;
    return Object.assign({}, f, { pG: val });
  });
  guardar();
  renderCards();
  renderTabla();
}

/* Estado: guarda, actualiza cards, cambia clase del select SIN re-render completo */
function onEstado(sel) {
  var id  = +sel.dataset.id;
  var val = sel.value;
  st.filas = st.filas.map(function(f) {
    if (f.id !== id) return f;
    return Object.assign({}, f, { estado: val });
  });
  guardar();
  renderCards();
  sel.className = 'estado estado-' + val.toLowerCase();
}

/* ── AGREGAR FILA ── */
function agregar() {
  st.filas.push({
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
  /* Foco en el nombre del nuevo ítem */
  setTimeout(function() {
    var inputs = document.querySelectorAll('.inp-rubro');
    var last   = inputs[inputs.length - 1];
    if (last) { last.focus(); last.select(); }
  }, 40);
}

/* ── ELIMINAR FILA ── */
function eliminar(btn) {
  var id   = +btn.dataset.id;
  var fila = st.filas.find(function(f) { return f.id === id; });
  if (!fila) return;
  if (st.filas.length <= 1) { alert('Debe haber al menos un ítem.'); return; }
  if (!confirm('¿Eliminar "' + fila.rubro + '"?\n\nEsta acción no se puede deshacer.')) return;
  st.filas = st.filas.filter(function(f) { return f.id !== id; });
  guardar();
  renderCards();
  renderTabla();
}

/* ── REINICIAR ── */
function resetData() {
  if (!confirm('¿Reiniciar todos los datos?\n\nSe restaurarán los ítems originales. Esta acción no se puede deshacer.')) return;
  st.filas = FILAS_BASE.map(function(f) { return Object.assign({}, f); });
  nextId   = 10;
  guardar();
  render();
}

/* ── EVENTOS FIJOS ── */
document.getElementById('btn-print').addEventListener('click', function() { window.print(); });
document.getElementById('btn-reset').addEventListener('click', resetData);
document.getElementById('btn-add').addEventListener('click', agregar);

/* ── INICIO ── */
cargar();
render();
