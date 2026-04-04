/* ══════════════════════════════════════════════════════════
   teacher.js  —  CalcuMental v2.0
   Lógica completa del panel docente.
═══════════════════════════════════════════════════════════ */

/* ─── Paleta ────────────────────────────────────────────── */
const PALETTE = [
  '#4338ca','#0891b2','#059669','#d97706',
  '#dc2626','#7c3aed','#db2777','#0369a1'
];

/* ─── Habilidades para heatmap ──────────────────────────── */
const SKILLS = [
  {id:'suma_N',  op:'suma',  conj:'N', lbl:'+ ℕ'},
  {id:'resta_N', op:'resta', conj:'N', lbl:'− ℕ'},
  {id:'mult_N',  op:'mult',  conj:'N', lbl:'× ℕ'},
  {id:'div_N',   op:'div',   conj:'N', lbl:'÷ ℕ'},
  {id:'pot_N',   op:'pot',   conj:'N', lbl:'xⁿ'},
  {id:'log_N',   op:'log',   conj:'N', lbl:'log'},
  {id:'raiz_N',  op:'raiz',  conj:'N', lbl:'√'},
  {id:'suma_Z',  op:'suma',  conj:'Z', lbl:'+ ℤ'},
  {id:'resta_Z', op:'resta', conj:'Z', lbl:'− ℤ'},
  {id:'mult_Z',  op:'mult',  conj:'Z', lbl:'× ℤ'},
  {id:'suma_Q',  op:'suma',  conj:'Q', lbl:'+ ℚ'},
  {id:'resta_Q', op:'resta', conj:'Q', lbl:'− ℚ'},
  {id:'mult_Q',  op:'mult',  conj:'Q', lbl:'× ℚ'},
  {id:'div_Q',   op:'div',   conj:'Q', lbl:'÷ ℚ'},
];

/* ─── Parámetros por operación ──────────────────────────── */
const OP_PARAMS = {
  suma:  [
    {key:'minA', label:'Mín. sumando A', default:10},
    {key:'maxA', label:'Máx. sumando A', default:99},
    {key:'minB', label:'Mín. sumando B', default:10},
    {key:'maxB', label:'Máx. sumando B', default:99},
  ],
  resta: [
    {key:'minA', label:'Mín. minuendo',    default:20},
    {key:'maxA', label:'Máx. minuendo',    default:99},
    {key:'minB', label:'Mín. sustraendo',  default:1},
    {key:'maxB', label:'Máx. sustraendo',  default:50},
  ],
  mult: [
    {key:'minA', label:'Mín. factor A', default:2},
    {key:'maxA', label:'Máx. factor A', default:12},
    {key:'minB', label:'Mín. factor B', default:2},
    {key:'maxB', label:'Máx. factor B', default:12},
  ],
  div: [
    {key:'minDiv', label:'Mín. divisor',   default:2},
    {key:'maxDiv', label:'Máx. divisor',   default:12},
    {key:'minCoc', label:'Mín. cociente',  default:2},
    {key:'maxCoc', label:'Máx. cociente',  default:12},
  ],
  pot: [
    {key:'minBase', label:'Mín. base',      default:2},
    {key:'maxBase', label:'Máx. base',      default:10},
    {key:'minExp',  label:'Mín. exponente', default:2},
    {key:'maxExp',  label:'Máx. exponente', default:4},
  ],
  log: [
    {key:'minExp', label:'Mín. exponente', default:1},
    {key:'maxExp', label:'Máx. exponente', default:4},
  ],
  raiz: [
    {key:'minRad', label:'Mín. radicando (base)', default:1},
    {key:'maxRad', label:'Máx. radicando (base)', default:10},
  ],
};

/* ─── Labels ────────────────────────────────────────────── */
const OP_LABELS  = {suma:'Suma',resta:'Resta',mult:'Mult.',div:'Div.',pot:'Potencia',log:'Log.',raiz:'Raíz'};
const CONJ_LABELS = {N:'ℕ Nat.',Z:'ℤ Ent.',Q:'ℚ Rac.'};
const OP_NAMES   = {suma:'Suma',resta:'Resta',mult:'Multiplicación',div:'División',pot:'Potencia',log:'Logaritmo',raiz:'Raíz'};
const CONJ_NAMES = {N:'ℕ Naturales',Z:'ℤ Enteros',Q:'ℚ Racionales'};

/* ─── Estado global ─────────────────────────────────────── */
const T = {
  cursos:      [],
  controles:   [],
  estudiantes: {},      // { cursoId: [...] }
  respuestas:  [],
  progData:    null,
  charts:      {},
  ejManuales:  [],
  panelActual: 'dashboard',
  deleteCb:    null,
  msState:     {        // estado multi-selects
    'ms-cursos': [], 'ms-ctrls': [], 'ms-ops': [], 'ms-conjs': []
  },
  progMode:    'curso', // 'curso' | 'estudiante'
  escala:      { notaMin:1, notaMax:7, notaAprobacion:4, pctAprobacion:60 },
  ultRows:     [],      // cache últimos resultados
  rgRows:      [],      // cache resultados generales
};

// Panel lateral de estudiantes
const sidePanel = { cursoId: null, estudiantes: [], filtro: '' };

/* ══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('cm_auth') === '1') mostrarApp();
  renderPaleta('mc-colors',    'mc-color');
  renderPaleta('mctrl-colors', 'mctrl-color');
  initMultiselects();
  // Cerrar dropdowns al hacer clic fuera
  document.addEventListener('click', e => {
    if (!e.target.closest('.multiselect-wrap')) closeAllDropdowns();
    if (!e.target.closest('.side-panel') && !e.target.closest('[onclick*="abrirSidePanel"]'))  { /* no cerrar automáticamente */ }
  });
});

/* ══════════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════════ */
async function login() {
  const pwd = document.getElementById('login-pwd').value;
  const err = document.getElementById('login-err');
  err.style.display = 'none';
  try {
    const res = await API.post({ action: 'verifyDocente', password: pwd });
    if (res.ok) {
      sessionStorage.setItem('cm_auth', '1');
      document.getElementById('login-overlay').classList.remove('open');
      mostrarApp();
    } else { err.style.display = 'block'; }
  } catch (e) {
    err.textContent = 'Error de conexión. Intenta de nuevo.';
    err.style.display = 'block';
  }
}
function logout() { sessionStorage.removeItem('cm_auth'); location.reload(); }

async function mostrarApp() {
  document.getElementById('app').classList.add('ready');
  await Promise.all([cargarCursos(), cargarControles()]);
  mostrarPanel('dashboard');
}

/* ══════════════════════════════════════════════════════════
   UTILS GENERALES
═══════════════════════════════════════════════════════════ */
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`; el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.style.animation = 'fadeOutRight .3s ease forwards'; setTimeout(() => el.remove(), 300); }, 3200);
}
function abrirModal(id)  { document.getElementById(id).classList.add('open'); }
function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }
function fmtTime(secs)   { return `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`; }
function fmtFecha(iso)   { if (!iso) return '—'; return new Date(iso).toLocaleDateString('es-CL',{day:'2-digit',month:'2-digit',year:'numeric'}); }
function genCodigo()     { const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const r=n=>Array.from({length:n},()=>c[Math.floor(Math.random()*c.length)]).join(''); return `${r(3)}-${r(3)}-${r(2)}`; }

function estadoBadge(e) {
  const m = {
    activo:   '<span class="badge badge-success badge-dot">Activo</span>',
    borrador: '<span class="badge badge-warning badge-dot">Borrador</span>',
    cerrado:  '<span class="badge badge-gray badge-dot">Cerrado</span>'
  };
  return m[e] || `<span class="badge badge-gray">${e}</span>`;
}

function renderMath(el, latex) {
  if (!el) return;
  el.innerHTML = '';
  if (window.katex) {
    try { katex.render(latex, el, { throwOnError: false, displayMode: false }); return; } catch (_) {}
  }
  el.textContent = latex;
}

function cursosDeControl(ctrl) {
  const ids = ctrl.cursos_ids || (ctrl.curso_id ? [ctrl.curso_id] : []);
  return ids.map(id => T.cursos.find(c => c.id === id)?.nombre || id).filter(Boolean).join(', ') || '—';
}

function confirmarDelete(msg, cb) {
  document.getElementById('delete-msg').textContent = msg;
  document.getElementById('btn-delete-ok').onclick = () => { cerrarModal('modal-delete'); cb(); };
  abrirModal('modal-delete');
}

/* ── Color palette ─────────────────────────────────────── */
function renderPaleta(pickerId, hiddenId) {
  const el = document.getElementById(pickerId);
  if (!el) return;
  el.innerHTML = PALETTE.map((c, i) => `
    <div class="color-swatch ${i===0?'selected':''}" style="background:${c}"
      onclick="selectColor('${pickerId}','${hiddenId}','${c}',this)"></div>`).join('');
}
function selectColor(pickerId, hiddenId, color, el) {
  document.getElementById(hiddenId).value = color;
  document.querySelectorAll(`#${pickerId} .color-swatch`).forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
}
function setColor(pickerId, hiddenId, color) {
  document.getElementById(hiddenId).value = color;
  document.querySelectorAll(`#${pickerId} .color-swatch`).forEach(s => {
    s.classList.toggle('selected', s.style.backgroundColor === hexToRgb(color));
  });
}
function hexToRgb(hex) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgb(${r}, ${g}, ${b})`;
}

/* ── Chart helpers ─────────────────────────────────────── */
function chartOpts(unit='%', legend=true) {
  return {
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { display: legend, position:'top', labels:{boxWidth:12, font:{size:11}} },
      tooltip: { callbacks:{ label: ctx => ` ${ctx.raw ?? '—'}${unit}` } }
    },
    scales: {
      y: { min:0, max: unit==='%'?100:undefined, ticks:{callback: v=>v+unit, font:{size:11}}, grid:{color:'#f3f4f6'} },
      x: { grid:{display:false}, ticks:{font:{size:11}} }
    }
  };
}
function destroyChart(key) { if (T.charts[key]) { T.charts[key].destroy(); delete T.charts[key]; } }

/* ═══════════════════════════════════════════════════════════
   NAVEGACIÓN
═══════════════════════════════════════════════════════════ */
const PANEL_META = {
  'dashboard':       ['Dashboard',            'Vista general del sistema'],
  'cursos':          ['Cursos',               'Gestiona los cursos y sus estudiantes'],
  'controles':       ['Controles',            'Evaluaciones de cálculo mental'],
  'ult-resultados':  ['Últimos resultados',   'Resultados por control con escala de notas'],
  'res-generales':   ['Resultados generales', 'Vista agregada para análisis de departamento'],
  'progresion':      ['Progresión',           'Evolución del desempeño en el tiempo'],
};

function mostrarPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`panel-${id}`)?.classList.add('active');
  document.querySelector(`[data-panel="${id}"]`)?.classList.add('active');
  const [title, sub] = PANEL_META[id] || [id,''];
  document.getElementById('hdr-title').textContent = title;
  document.getElementById('hdr-sub').textContent   = sub;
  document.getElementById('hdr-actions').innerHTML  = '';
  T.panelActual = id;
  switch (id) {
    case 'dashboard':      renderDashboard(); break;
    case 'cursos':         renderCursos(); break;
    case 'controles':      llenarFiltrosCursos(); renderControles(); break;
    case 'ult-resultados': llenarFiltrosUlt(); break;
    case 'res-generales':  llenarFiltrosRG(); break;
    case 'progresion':     llenarFiltrosProgresion(); break;
  }
}

/* ═══════════════════════════════════════════════════════════
   DATA LOADING
═══════════════════════════════════════════════════════════ */
async function cargarCursos() {
  try { T.cursos = await API.get('getCursos'); } catch (_) { T.cursos = []; }
}
async function cargarControles() {
  try {
    T.controles = await API.get('getControles');
    const activos = T.controles.filter(c => c.estado === 'activo').length;
    const badge   = document.getElementById('badge-activos');
    badge.style.display = activos > 0 ? 'inline' : 'none';
    badge.textContent   = activos;
  } catch (_) { T.controles = []; }
}
async function cargarEstudiantes(cursoId) {
  if (!T.estudiantes[cursoId]) {
    try { T.estudiantes[cursoId] = await API.get('getEstudiantes', { cursoId }); }
    catch (_) { T.estudiantes[cursoId] = []; }
  }
  return T.estudiantes[cursoId];
}
function invalidarEstudiantes(cursoId) { delete T.estudiantes[cursoId]; }

/* ═══════════════════════════════════════════════════════════
   DASHBOARD v2.0
═══════════════════════════════════════════════════════════ */
function renderDashboard() {
  const activos = T.controles.filter(c => c.estado === 'activo');
  document.getElementById('d-activos').textContent = activos.length;
  cargarMetricasDashboard();
  renderActiveList(activos);
}

async function cargarMetricasDashboard() {
  try {
    const m = await API.get('getDashboardMetrics');
    document.getElementById('d-activos').textContent    = m.activos       ?? '—';
    document.getElementById('d-rendidos').textContent   = m.controlesRendidosHoy ?? '0';
    document.getElementById('d-promedio').textContent   = m.promedioHoy !== null ? m.promedioHoy+'%' : '—';
    document.getElementById('d-estudiantes').textContent = m.estudiantesHoy ?? '0';
  } catch (_) {}
}

function renderActiveList(activos) {
  const el = document.getElementById('dash-activos-list');
  if (!activos.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h4>Sin controles activos</h4><p>Activa un control desde la sección Controles</p></div>`;
    return;
  }
  el.innerHTML = activos.map(ctrl => `
    <div class="active-ctrl-card" style="border-left-color:${ctrl.color||'#4338ca'}">
      <div class="ac-info">
        <div class="ac-name">${ctrl.nombre}</div>
        <div class="ac-meta">${cursosDeControl(ctrl)} · Código: <code>${ctrl.codigo||'—'}</code></div>
      </div>
      <div class="ac-stat">
        <div class="val">${ctrl.n_enviados??'—'}</div>
        <div class="lbl">Enviaron</div>
      </div>
      <button class="btn btn-danger btn-xs" onclick="toggleControl('${ctrl.id}','cerrado')">Cerrar</button>
    </div>`).join('');
}

/* ═══════════════════════════════════════════════════════════
   CURSOS
═══════════════════════════════════════════════════════════ */
function renderCursos() {
  const el = document.getElementById('cursos-grid');
  if (!T.cursos.length) {
    el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📚</div><h4>Sin cursos aún</h4><p>Crea tu primer curso para empezar</p></div>`;
    return;
  }
  el.innerHTML = T.cursos.map(c => {
    const nCtrls = T.controles.filter(ct => (ct.cursos_ids||[ct.curso_id]).includes(c.id)).length;
    return `
      <div class="curso-card">
        <div class="curso-stripe" style="background:${c.color||'#4338ca'}"></div>
        <div class="curso-name">${c.nombre}</div>
        ${c.descripcion ? `<div class="curso-desc">${c.descripcion}</div>` : ''}
        <div class="curso-stats">
          <div class="curso-stat"><strong>${nCtrls}</strong> controles</div>
          <div class="curso-stat">Creado ${fmtFecha(c.fecha_creacion)}</div>
        </div>
        <div class="curso-actions">
          <button class="btn btn-outline btn-xs" onclick="abrirSidePanel('${c.id}')">👥 Estudiantes</button>
          <button class="btn btn-ghost btn-xs"   onclick="editarCurso('${c.id}')">Editar</button>
          <button class="btn btn-danger btn-xs"  onclick="confirmarDelete('¿Eliminar el curso &quot;${c.nombre}&quot;?',()=>eliminarCurso('${c.id}'))">✕</button>
        </div>
      </div>`;
  }).join('');
}

function abrirModalCurso() {
  document.getElementById('mc-title').textContent = 'Nuevo curso';
  document.getElementById('mc-id').value    = '';
  document.getElementById('mc-nombre').value = '';
  document.getElementById('mc-desc').value   = '';
  renderPaleta('mc-colors','mc-color');
  abrirModal('modal-curso');
}
function editarCurso(id) {
  const c = T.cursos.find(x => x.id === id); if (!c) return;
  document.getElementById('mc-title').textContent = 'Editar curso';
  document.getElementById('mc-id').value     = id;
  document.getElementById('mc-nombre').value = c.nombre;
  document.getElementById('mc-desc').value   = c.descripcion || '';
  renderPaleta('mc-colors','mc-color');
  setColor('mc-colors','mc-color', c.color || PALETTE[0]);
  abrirModal('modal-curso');
}
async function guardarCurso() {
  const nombre = document.getElementById('mc-nombre').value.trim();
  if (!nombre) { toast('El nombre es obligatorio','error'); return; }
  const curso = {
    id:             document.getElementById('mc-id').value || ('c_'+Date.now()),
    nombre,
    descripcion:    document.getElementById('mc-desc').value.trim(),
    color:          document.getElementById('mc-color').value,
    fecha_creacion: new Date().toISOString()
  };
  try {
    await API.post({ action:'saveCurso', curso });
    cerrarModal('modal-curso');
    await cargarCursos();
    renderCursos(); llenarFiltrosCursos();
    toast('Curso guardado ✓','success');
  } catch (e) { toast('Error: '+e.message,'error'); }
}
async function eliminarCurso(id) {
  try {
    await API.post({ action:'deleteCurso', id });
    await cargarCursos(); renderCursos();
    toast('Curso eliminado','success');
  } catch (e) { toast('Error: '+e.message,'error'); }
}

/* ═══════════════════════════════════════════════════════════
   PANEL LATERAL: ESTUDIANTES
═══════════════════════════════════════════════════════════ */
async function abrirSidePanel(cursoId) {
  sidePanel.cursoId = cursoId;
  const curso = T.cursos.find(c => c.id === cursoId);
  document.getElementById('side-curso-nombre').textContent = `Estudiantes — ${curso?.nombre || ''}`;
  document.getElementById('est-buscar').value = '';
  sidePanel.filtro = '';
  document.getElementById('est-lista').innerHTML = '<div class="loading-wrap" style="min-height:100px"><div class="spinner spinner-sm"></div></div>';
  document.getElementById('side-estudiantes').classList.add('open');
  const ests = await cargarEstudiantes(cursoId);
  sidePanel.estudiantes = ests;
  renderEstudiantes();
}

function cerrarSidePanel() {
  document.getElementById('side-estudiantes').classList.remove('open');
}

function renderEstudiantes() {
  const ests = sidePanel.estudiantes.filter(e => {
    const q = sidePanel.filtro.toLowerCase();
    return !q || `${e.nombre} ${e.apellido}`.toLowerCase().includes(q) || String(e.rut).includes(q);
  });
  document.getElementById('side-curso-count').textContent = `${ests.length} estudiante${ests.length!==1?'s':''}`;
  const el = document.getElementById('est-lista');
  if (!ests.length) {
    el.innerHTML = `<div class="empty-state" style="padding:1.5rem"><div class="empty-icon">👥</div><h4>Sin estudiantes</h4><p>Agrega el primer estudiante del curso</p></div>`;
    return;
  }
  el.innerHTML = ests.map(e => {
    const iniciales = `${e.nombre?.[0]||''}${e.apellido?.[0]||''}`.toUpperCase();
    return `
      <div class="est-item">
        <div class="est-avatar">${iniciales}</div>
        <div class="est-info">
          <div class="est-nombre">${e.nombre} ${e.apellido}</div>
          <div class="est-rut">${formatRut(e.rut)}</div>
        </div>
        <div class="est-actions">
          <button class="btn btn-ghost btn-xs" onclick="abrirModalEstudiante('${e.rut}','${sidePanel.cursoId}')">Editar</button>
          <button class="btn btn-danger btn-xs" onclick="confirmarDeleteEst('${e.rut}','${e.nombre} ${e.apellido}')">✕</button>
        </div>
      </div>`;
  }).join('');
}

function filtrarEstudiantes(q) {
  sidePanel.filtro = q;
  renderEstudiantes();
}

function abrirModalEstudiante(rut, cursoId) {
  const esNuevo = !rut;
  document.getElementById('mest-title').textContent = esNuevo ? 'Agregar estudiante' : 'Editar estudiante';
  document.getElementById('mest-rut-original').value = rut || '';
  document.getElementById('mest-rut').value     = '';
  document.getElementById('mest-nombre').value   = '';
  document.getElementById('mest-apellido').value = '';
  document.getElementById('mest-rut-status').textContent = '';
  document.getElementById('mest-rut-hint').textContent   = 'Identificador único del estudiante';

  // Llenar selector de curso
  const sel = document.getElementById('mest-curso');
  sel.innerHTML = T.cursos.map(c => `<option value="${c.id}" ${c.id===cursoId?'selected':''}>${c.nombre}</option>`).join('');

  if (rut) {
    const e = sidePanel.estudiantes.find(x => x.rut === rut);
    if (e) {
      document.getElementById('mest-rut').value     = formatRut(e.rut);
      document.getElementById('mest-nombre').value   = e.nombre;
      document.getElementById('mest-apellido').value = e.apellido;
      document.getElementById('mest-curso').value    = e.curso_id || cursoId;
      const valido = validarRut(formatRut(e.rut));
      document.getElementById('mest-rut').classList.toggle('is-valid', valido);
      document.getElementById('mest-rut-status').textContent = valido ? '✓' : '';
      document.getElementById('mest-rut-status').className   = 'rut-status ' + (valido ? 'ok' : '');
    }
  }
  abrirModal('modal-estudiante');
}

async function guardarEstudiante() {
  const rut      = document.getElementById('mest-rut').value.trim();
  const nombre   = document.getElementById('mest-nombre').value.trim();
  const apellido = document.getElementById('mest-apellido').value.trim();
  const cursoId  = document.getElementById('mest-curso').value;

  if (!rut)      { toast('El RUT es obligatorio','error'); return; }
  if (!validarRut(rut)) { toast('RUT inválido. Verifica el dígito verificador.','error'); return; }
  if (!nombre)   { toast('El nombre es obligatorio','error'); return; }
  if (!apellido) { toast('El apellido es obligatorio','error'); return; }

  const est = { rut: normalizarRut(rut), nombre, apellido, curso_id: cursoId };
  try {
    await API.post({ action:'saveEstudiante', estudiante: est });
    cerrarModal('modal-estudiante');
    invalidarEstudiantes(cursoId);
    const ests = await cargarEstudiantes(cursoId);
    sidePanel.estudiantes = ests;
    renderEstudiantes();
    toast('Estudiante guardado ✓','success');
  } catch (e) { toast('Error: '+e.message,'error'); }
}

function confirmarDeleteEst(rut, nombre) {
  confirmarDelete(`¿Eliminar a "${nombre}" (${formatRut(rut)}) del sistema?`, async () => {
    try {
      await API.post({ action:'deleteEstudiante', rut });
      invalidarEstudiantes(sidePanel.cursoId);
      const ests = await cargarEstudiantes(sidePanel.cursoId);
      sidePanel.estudiantes = ests;
      renderEstudiantes();
      toast('Estudiante eliminado','success');
    } catch (e) { toast('Error: '+e.message,'error'); }
  });
}

function exportarEstudiantes() {
  const ests = sidePanel.estudiantes;
  if (!ests.length) { toast('No hay estudiantes para exportar','error'); return; }
  const curso = T.cursos.find(c => c.id === sidePanel.cursoId);
  const rows  = [['RUT','Nombre','Apellido','Curso','Fecha registro']];
  ests.forEach(e => rows.push([formatRut(e.rut), e.nombre, e.apellido, curso?.nombre||'', fmtFecha(e.fecha_registro)]));
  descargarCSV(rows, `estudiantes_${curso?.nombre||'curso'}`);
}

/* ─── RUT helpers ───────────────────────────────────────── */
function validarRut(rutCompleto) {
  try {
    const limpio = String(rutCompleto).replace(/[.\-\s]/g,'').toUpperCase();
    if (limpio.length < 2) return false;
    const dv = limpio.slice(-1), nums = limpio.slice(0,-1);
    if (!/^\d+$/.test(nums)) return false;
    let suma = 0, mul = 2;
    for (let i = nums.length-1; i >= 0; i--) { suma += parseInt(nums[i])*mul; mul = mul===7?2:mul+1; }
    const dvEsp = 11-(suma%11);
    return dv === (dvEsp===11?'0':dvEsp===10?'K':String(dvEsp));
  } catch (_) { return false; }
}
function normalizarRut(rut) { return String(rut).replace(/[\.\s]/g,'').toUpperCase(); }
function formatRut(rut) {
  const limpio = String(rut).replace(/[.\-\s]/g,'').toUpperCase();
  if (limpio.length < 2) return rut;
  const num = limpio.slice(0,-1), dv = limpio.slice(-1);
  if (num.length > 6) return `${num.slice(0,-6)}.${num.slice(-6,-3)}.${num.slice(-3)}-${dv}`;
  if (num.length > 3) return `${num.slice(0,-3)}.${num.slice(-3)}-${dv}`;
  return `${num}-${dv}`;
}

function onRutInputModal(input) {
  let val = input.value.replace(/[^0-9kK]/g,'').toUpperCase();
  if (val.length > 9) val = val.slice(0,9);
  const num = val.slice(0,-1), dv = val.slice(-1);
  let fmt = '';
  if (num.length > 6)      fmt = `${num.slice(0,-6)}.${num.slice(-6,-3)}.${num.slice(-3)}-${dv}`;
  else if (num.length > 3) fmt = `${num.slice(0,-3)}.${num.slice(-3)}-${dv}`;
  else if (num.length > 0) fmt = `${num}-${dv}`;
  else fmt = val;
  input.value = fmt;
  const statusEl = document.getElementById('mest-rut-status');
  const hintEl   = document.getElementById('mest-rut-hint');
  if (val.length >= 7) {
    const ok = validarRut(fmt);
    input.classList.toggle('is-valid',   ok);
    input.classList.toggle('is-invalid', !ok);
    statusEl.className   = 'rut-status ' + (ok?'ok':'err');
    statusEl.textContent = ok ? '✓' : '✗';
    hintEl.textContent   = ok ? 'RUT válido' : 'Dígito verificador incorrecto';
  } else {
    input.classList.remove('is-valid','is-invalid');
    statusEl.textContent = '';
    hintEl.textContent   = 'Identificador único del estudiante';
  }
}
function onRutBlurModal(input) {
  if (!input.value.trim()) return;
  const ok = validarRut(input.value.trim());
  const s  = document.getElementById('mest-rut-status');
  input.classList.toggle('is-valid',ok); input.classList.toggle('is-invalid',!ok);
  s.className = 'rut-status '+(ok?'ok':'err'); s.textContent = ok?'✓':'✗';
}

/* ═══════════════════════════════════════════════════════════
   INCONSISTENCIAS
═══════════════════════════════════════════════════════════ */
async function abrirInconsistencias() {
  abrirModal('modal-inconsistencias');
  document.getElementById('inconsistencias-lista').innerHTML =
    '<div class="loading-wrap"><div class="spinner"></div><span>Analizando datos…</span></div>';
  try {
    const res = await API.get('detectarInconsistencias');
    renderInconsistencias(res);
  } catch (e) {
    document.getElementById('inconsistencias-lista').innerHTML =
      `<div style="color:var(--c-danger);padding:1rem">Error: ${e.message}</div>`;
  }
}

function renderInconsistencias({ alertas, total }) {
  const el = document.getElementById('inconsistencias-lista');
  if (!total) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><h4>Sin inconsistencias detectadas</h4><p>Los datos de los estudiantes están en orden.</p></div>`;
    return;
  }
  const iconos = { error:'🔴', warning:'🟡', info:'🔵' };
  el.innerHTML = `<p style="font-size:.82rem;color:var(--c-text-3);margin-bottom:.75rem">Se encontraron ${total} alerta${total!==1?'s':''}</p>` +
    alertas.map(a => `
      <div class="alert-badge alert-badge-${a.tipo}">
        <span class="alert-icon">${iconos[a.tipo]||'ℹ'}</span>
        <div class="alert-body">
          <div class="alert-msg">${a.mensaje}</div>
          ${a.nombres?.length ? `<div class="alert-detail">Nombres: ${a.nombres.join(' / ')}</div>` : ''}
          <div class="alert-actions">
            ${a.codigo==='RUTS_SIMILARES' && a.ruts.length===2 ? `
              <button class="btn btn-warning btn-xs"
                onclick="fusionarRuts('${a.ruts[0]}','${a.ruts[1]}')">
                Fusionar → mantener ${formatRut(a.ruts[1])}
              </button>` : ''}
            ${a.ruts?.length===1 ? `
              <button class="btn btn-outline btn-xs"
                onclick="abrirModalEstudiante('${a.ruts[0]}', null)">
                Editar
              </button>` : ''}
          </div>
        </div>
      </div>`).join('');
}

async function fusionarRuts(origen, destino) {
  try {
    const res = await API.post({ action:'fusionarRuts', rutOrigen: origen, rutDestino: destino });
    toast(`Fusión completada: ${res.actualizadas} registros actualizados`,'success');
    await abrirInconsistencias(); // recargar
  } catch (e) { toast('Error: '+e.message,'error'); }
}

/* ═══════════════════════════════════════════════════════════
   CONTROLES
═══════════════════════════════════════════════════════════ */
function llenarFiltrosCursos() {
  ['flt-curso','mctrl-cursos'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    if (id === 'flt-curso') {
      el.innerHTML = '<option value="">Todos los cursos</option>' +
        T.cursos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    } else {
      el.innerHTML = T.cursos.map(c =>
        `<label class="checkbox-pill"><input type="checkbox" class="curso-chk" value="${c.id}"> ${c.nombre}</label>`
      ).join('');
    }
  });
}

function renderControles() {
  const fltE = document.getElementById('flt-estado')?.value || '';
  const fltC = document.getElementById('flt-curso')?.value  || '';
  let lista  = T.controles;
  if (fltE) lista = lista.filter(c => c.estado === fltE);
  if (fltC) lista = lista.filter(c => (c.cursos_ids||[c.curso_id]).includes(fltC));

  const el = document.getElementById('ctrl-list');
  if (!lista.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h4>Sin controles</h4><p>Crea tu primer control o ajusta los filtros</p></div>`;
    return;
  }
  el.innerHTML = lista.map(ctrl => {
    const ops  = (ctrl.operaciones||[]).map(o=>OP_LABELS[o]||o).join(', ')  || '—';
    const conjs = (ctrl.conjuntos  ||[]).map(c=>CONJ_LABELS[c]||c).join(', ') || '—';
    return `
      <div class="ctrl-card" style="border-left-color:${ctrl.color||'#4338ca'}">
        <div class="ctrl-info">
          <div class="ctrl-name">${estadoBadge(ctrl.estado)} ${ctrl.nombre}</div>
          <div class="ctrl-meta">
            <span>${cursosDeControl(ctrl)}</span> ·
            <span>${ctrl.cantidad||'?'} ej.</span> ·
            <span>${ops}</span> · <span>${conjs}</span> ·
            <span class="ctrl-code">${ctrl.codigo||'—'}</span>
          </div>
        </div>
        <div class="toggle-wrap">
          <label class="toggle">
            <input type="checkbox" ${ctrl.estado==='activo'?'checked':''}
              onchange="toggleControl('${ctrl.id}',this.checked?'activo':'cerrado')">
            <div class="toggle-thumb"></div>
          </label>
          <span class="toggle-label">${ctrl.estado==='activo'?'Activo':'Inactivo'}</span>
        </div>
        <div class="ctrl-actions">
          <button class="btn btn-ghost btn-xs" onclick="editarControl('${ctrl.id}')">Editar</button>
          <button class="btn btn-danger btn-xs"
            onclick="confirmarDelete('¿Eliminar &quot;${ctrl.nombre}&quot;?',()=>eliminarControl('${ctrl.id}'))">✕</button>
        </div>
      </div>`;
  }).join('');
}

/* ── Modal control ──────────────────────────────────────── */
function abrirModalControl() {
  T.ejManuales = [];
  document.getElementById('mctrl-title').textContent = 'Nuevo control';
  document.getElementById('mctrl-id').value      = '';
  document.getElementById('mctrl-nombre').value  = '';
  document.getElementById('mctrl-codigo').value  = genCodigo();
  document.getElementById('mctrl-tiempo-tipo').value = 'global';
  document.getElementById('mctrl-tiempo-val').value  = '20';
  document.getElementById('mctrl-cantidad').value    = '10';
  document.getElementById('mctrl-modo').value        = 'auto';
  document.querySelectorAll('.op-chk').forEach(cb  => { cb.checked = cb.value==='suma'; });
  document.querySelectorAll('.conj-chk').forEach(cb => { cb.checked = cb.value==='N'; });
  renderPaleta('mctrl-colors','mctrl-color');
  llenarFiltrosCursos();
  onTiempoTipoChange(); onModoChange();
  renderParamsAccordion(); renderEjManuales();
  abrirModal('modal-control');
}

function editarControl(id) {
  const ctrl = T.controles.find(c => c.id === id); if (!ctrl) return;
  T.ejManuales = ctrl.ejercicios_manuales ? [...ctrl.ejercicios_manuales] : [];
  document.getElementById('mctrl-title').textContent = 'Editar control';
  document.getElementById('mctrl-id').value      = id;
  document.getElementById('mctrl-nombre').value  = ctrl.nombre;
  document.getElementById('mctrl-codigo').value  = ctrl.codigo || genCodigo();
  document.getElementById('mctrl-tiempo-tipo').value = ctrl.tiempo_tipo || 'global';
  document.getElementById('mctrl-tiempo-val').value  = ctrl.tiempo_valor || 20;
  document.getElementById('mctrl-cantidad').value    = ctrl.cantidad || 10;
  document.getElementById('mctrl-modo').value        = ctrl.modo || 'auto';
  document.querySelectorAll('.op-chk').forEach(cb  => { cb.checked = (ctrl.operaciones||[]).includes(cb.value); });
  document.querySelectorAll('.conj-chk').forEach(cb => { cb.checked = (ctrl.conjuntos  ||[]).includes(cb.value); });
  renderPaleta('mctrl-colors','mctrl-color');
  setColor('mctrl-colors','mctrl-color', ctrl.color || PALETTE[0]);
  llenarFiltrosCursos();
  const ids = ctrl.cursos_ids || (ctrl.curso_id ? [ctrl.curso_id] : []);
  document.querySelectorAll('.curso-chk').forEach(cb => { cb.checked = ids.includes(cb.value); });
  onTiempoTipoChange(); onModoChange();
  // Restore params
  if (ctrl.params_operaciones) {
    Object.entries(ctrl.params_operaciones).forEach(([op, vals]) => {
      Object.entries(vals).forEach(([key, val]) => {
        const inp = document.getElementById(`param-${op}-${key}`);
        if (inp) inp.value = val;
      });
    });
  }
  renderEjManuales(); abrirModal('modal-control');
}

function onTiempoTipoChange() {
  const tipo  = document.getElementById('mctrl-tiempo-tipo').value;
  const wrap  = document.getElementById('mctrl-tiempo-val-wrap');
  const label = document.getElementById('mctrl-tiempo-lbl');
  wrap.style.display = tipo==='libre' ? 'none' : 'block';
  label.textContent  = tipo==='por_pregunta' ? 'Segundos por pregunta' : 'Duración (minutos)';
  if (tipo==='por_pregunta' && document.getElementById('mctrl-tiempo-val').value==='20')
    document.getElementById('mctrl-tiempo-val').value = '30';
}

function onModoChange() {
  const modo = document.getElementById('mctrl-modo').value;
  document.getElementById('mctrl-auto-cfg').style.display   = modo==='manual' ? 'none' : 'block';
  document.getElementById('mctrl-manual-cfg').style.display = modo==='auto'   ? 'none' : 'block';
  if (modo !== 'auto') renderParamsAccordion();
}

async function guardarControl(estado='borrador') {
  const nombre = document.getElementById('mctrl-nombre').value.trim();
  if (!nombre) { toast('El nombre es obligatorio','error'); return; }
  const cursos_ids  = Array.from(document.querySelectorAll('.curso-chk:checked')).map(cb=>cb.value);
  const operaciones = Array.from(document.querySelectorAll('.op-chk:checked')).map(cb=>cb.value);
  const conjuntos   = Array.from(document.querySelectorAll('.conj-chk:checked')).map(cb=>cb.value);
  const params      = getParamsFromUI();
  const ctrl = {
    id:                  document.getElementById('mctrl-id').value || ('ctrl_'+Date.now()),
    nombre,
    codigo:              document.getElementById('mctrl-codigo').value.toUpperCase() || genCodigo(),
    cursos_ids, curso_id: cursos_ids[0]||'',
    color:               document.getElementById('mctrl-color').value,
    tiempo_tipo:         document.getElementById('mctrl-tiempo-tipo').value,
    tiempo_valor:        parseInt(document.getElementById('mctrl-tiempo-val').value)||20,
    cantidad:            parseInt(document.getElementById('mctrl-cantidad').value)||10,
    modo:                document.getElementById('mctrl-modo').value,
    operaciones, conjuntos, params_operaciones: params,
    ejercicios_manuales: T.ejManuales,
    estado, fecha_creacion: new Date().toISOString()
  };
  try {
    await API.post({ action:'saveControl', control: ctrl });
    cerrarModal('modal-control');
    await cargarControles(); renderControles();
    if (T.panelActual==='dashboard') renderDashboard();
    toast(estado==='activo'?'Control activado ✓':'Control guardado ✓','success');
  } catch (e) { toast('Error: '+e.message,'error'); }
}

async function toggleControl(id, nuevoEstado) {
  try {
    await API.post({ action:'toggleControl', id, estado: nuevoEstado });
    await cargarControles(); renderControles();
    if (T.panelActual==='dashboard') renderDashboard();
  } catch (e) { toast('Error al cambiar estado','error'); await cargarControles(); renderControles(); }
}

async function eliminarControl(id) {
  try {
    await API.post({ action:'deleteControl', id });
    await cargarControles(); renderControles();
    toast('Control eliminado','success');
  } catch (e) { toast('Error: '+e.message,'error'); }
}

/* ── Parámetros por operación ───────────────────────────── */
function renderParamsAccordion() {
  const ops = Array.from(document.querySelectorAll('.op-chk:checked')).map(cb=>cb.value);
  const el  = document.getElementById('params-accordion');
  if (!el) return;
  el.innerHTML = ops.map(op => {
    const defs  = OP_PARAMS[op] || [];
    const fields = defs.map(p => `
      <div class="param-field">
        <label>${p.label}</label>
        <input type="number" id="param-${op}-${p.key}" value="${p.default}" min="0">
      </div>`).join('');
    return `
      <div class="params-op-header" onclick="toggleParamOp(this)">
        <span>${OP_NAMES[op]||op}</span>
        <span class="params-op-chevron">▶</span>
      </div>
      <div class="params-op-body">
        ${defs.length ? `<div class="param-row">${fields}</div>` : '<p style="color:var(--c-text-3);font-size:.84rem">Sin parámetros configurables</p>'}
      </div>`;
  }).join('');
}

function toggleParamOp(header) {
  header.classList.toggle('open');
  header.nextElementSibling.classList.toggle('open');
}

function getParamsFromUI() {
  const ops    = Array.from(document.querySelectorAll('.op-chk:checked')).map(cb=>cb.value);
  const params = {};
  ops.forEach(op => {
    const defs = OP_PARAMS[op] || [];
    if (!defs.length) return;
    params[op] = {};
    defs.forEach(p => {
      const inp = document.getElementById(`param-${op}-${p.key}`);
      if (inp) params[op][p.key] = parseFloat(inp.value) || p.default;
    });
  });
  return params;
}

// Actualizar accordion cuando cambian las operaciones
document.addEventListener('change', e => {
  if (e.target.classList.contains('op-chk')) renderParamsAccordion();
});

/* ── Previsualización de ejercicios ─────────────────────── */
async function previsualizarEjercicios() {
  const ops   = Array.from(document.querySelectorAll('.op-chk:checked')).map(cb=>cb.value);
  const conjs = Array.from(document.querySelectorAll('.conj-chk:checked')).map(cb=>cb.value);
  if (!ops.length || !conjs.length) { toast('Selecciona al menos una operación y un conjunto','error'); return; }
  const btn   = document.getElementById('btn-preview');
  const grid  = document.getElementById('preview-grid');
  btn.disabled = true; btn.textContent = '⏳ Generando…';
  try {
    const ejs = await API.get('previsualizarEjercicios', {
      operaciones:       JSON.stringify(ops),
      conjuntos:         JSON.stringify(conjs),
      params_operaciones: JSON.stringify(getParamsFromUI()),
      cantidad:          5
    });
    grid.style.display = 'grid';
    grid.innerHTML = ejs.map(ej => {
      const el = document.createElement('div');
      el.className = 'preview-item';
      const mathEl = document.createElement('div');
      if (window.katex) {
        try { katex.render(ej.latex, mathEl, { throwOnError:false, displayMode:true }); }
        catch (_) { mathEl.textContent = ej.latex; }
      } else { mathEl.textContent = ej.latex; }
      el.appendChild(mathEl);
      const ans = document.createElement('div');
      ans.className = 'preview-ans';
      ans.textContent = `Resp: ${ej.respuesta_correcta||'?'}`;
      el.appendChild(ans);
      return el.outerHTML;
    }).join('');
  } catch (e) { toast('Error al previsualizar: '+e.message,'error'); }
  btn.disabled = false; btn.textContent = '👁 Generar vista previa (5 ejercicios)';
}

/* ── Constructor visual ─────────────────────────────────── */
function setEjInputMode(mode, tabEl) {
  document.getElementById('ej-mode-visual').style.display = mode==='visual' ? 'block' : 'none';
  document.getElementById('ej-mode-latex').style.display  = mode==='latex'  ? 'block' : 'none';
  document.querySelectorAll('#ej-input-tabs .vb-tab').forEach(t=>t.classList.remove('active'));
  tabEl.classList.add('active');
}

function onVbTipoChange() {
  const tipo    = document.getElementById('vb-tipo').value;
  const opWrap  = document.getElementById('vb-op-wrap');
  const fields  = document.getElementById('vb-fields');
  opWrap.style.display = tipo==='basico' ? 'block' : 'none';

  const inp = (id, placeholder, label) =>
    `<div class="vb-operand"><label>${label}</label><input type="text" id="${id}" placeholder="${placeholder}" oninput="actualizarVbPreview()"></div>`;

  const seps = {
    basico:    `${inp('vb-a','a','Operando A')} <div class="vb-op-sym" id="vb-op-sym">+</div> ${inp('vb-b','b','Operando B')}`,
    fraccion:  `<div class="vb-frac"><input type="text" id="vb-fn" class="frac-input" placeholder="a" oninput="actualizarVbPreview()"><div class="vb-frac-line"></div><input type="text" id="vb-fd" class="frac-input" placeholder="b" oninput="actualizarVbPreview()"></div> <div class="vb-op-sym" id="vb-op-sym">+</div> <div class="vb-frac"><input type="text" id="vb-fn2" class="frac-input" placeholder="c" oninput="actualizarVbPreview()"><div class="vb-frac-line"></div><input type="text" id="vb-fd2" class="frac-input" placeholder="d" oninput="actualizarVbPreview()"></div>`,
    potencia:  `${inp('vb-base','base','Base')} <div class="vb-op-sym">^</div> ${inp('vb-exp','n','Exponente')}`,
    raiz:      `${inp('vb-idx','2','Índice')} <div class="vb-op-sym">√</div> ${inp('vb-rad','a','Radicando')}`,
    logaritmo: `<span style="font-size:1rem;margin-top:14px">log</span>${inp('vb-lbase','b','Base')} ${inp('vb-larg','a','Argumento')}`,
  };
  fields.innerHTML = `<div class="vb-row">${seps[tipo]||''}</div>`;

  // Sincronizar símbolo de operación con selector
  const opSel = document.getElementById('vb-op');
  if (opSel) opSel.addEventListener('change', () => {
    const sym = document.getElementById('vb-op-sym');
    if (sym) sym.textContent = {'+':'+','-':'−','\\times':'×','\\div':'÷'}[opSel.value] || opSel.value;
    actualizarVbPreview();
  });
  actualizarVbPreview();
}

function actualizarVbPreview() {
  const tipo   = document.getElementById('vb-tipo').value;
  const prevEl = document.getElementById('vb-preview');
  const op     = document.getElementById('vb-op')?.value || '+';
  let latex    = '';

  const v = id => document.getElementById(id)?.value.trim() || '?';

  switch (tipo) {
    case 'basico':    latex = `${v('vb-a')} ${op} ${v('vb-b')}`; break;
    case 'fraccion':  latex = `\\dfrac{${v('vb-fn')}}{${v('vb-fd')}} ${op} \\dfrac{${v('vb-fn2')}}{${v('vb-fd2')}}`; break;
    case 'potencia':  latex = `${v('vb-base')}^{${v('vb-exp')}}`; break;
    case 'raiz': {
      const idx = v('vb-idx');
      latex = idx==='2' ? `\\sqrt{${v('vb-rad')}}` : `\\sqrt[${idx}]{${v('vb-rad')}}`;
      break;
    }
    case 'logaritmo': latex = `\\log_{${v('vb-lbase')}}\\left(${v('vb-larg')}\\right)`; break;
  }

  prevEl.innerHTML = '';
  if (window.katex) {
    try { katex.render(latex, prevEl, { throwOnError:false, displayMode:true }); return; } catch (_) {}
  }
  prevEl.textContent = latex;
  return latex;
}

function agregarEjVisual() {
  const tipo   = document.getElementById('vb-tipo').value;
  const resp   = document.getElementById('vb-resp').value.trim();
  const opLbl  = document.getElementById('vb-op-label').value;
  const conjLbl = document.getElementById('vb-conj-label').value;
  const prevEl = document.getElementById('vb-preview');
  const latex  = actualizarVbPreview();
  if (!prevEl.textContent && !prevEl.querySelector('.katex')) { toast('Completa el ejercicio primero','error'); return; }

  // Rebuild latex para guardar
  const op = document.getElementById('vb-op')?.value || '+';
  const v  = id => document.getElementById(id)?.value.trim() || '?';
  let ltx  = '';
  switch (tipo) {
    case 'basico':    ltx = `${v('vb-a')} ${op} ${v('vb-b')}`; break;
    case 'fraccion':  ltx = `\\dfrac{${v('vb-fn')}}{${v('vb-fd')}} ${op} \\dfrac{${v('vb-fn2')}}{${v('vb-fd2')}}`; break;
    case 'potencia':  ltx = `${v('vb-base')}^{${v('vb-exp')}}`; break;
    case 'raiz': { const idx=v('vb-idx'); ltx = idx==='2'?`\\sqrt{${v('vb-rad')}}`:`\\sqrt[${idx}]{${v('vb-rad')}}`; break; }
    case 'logaritmo': ltx = `\\log_{${v('vb-lbase')}}\\left(${v('vb-larg')}\\right)`; break;
  }

  T.ejManuales.push({ id:'ej_'+Date.now(), latex:ltx, respuesta_correcta:resp, operacion:opLbl, conjunto:conjLbl, is_manual:true });
  document.getElementById('vb-resp').value = '';
  renderEjManuales();
  toast('Ejercicio agregado ✓','success');
}

/* ── Ejercicios manual (LaTeX mode) ─────────────────────── */
function previewLatex() {
  const latex = document.getElementById('mctrl-ej-latex').value;
  const box   = document.getElementById('latex-preview');
  if (!latex.trim()) { box.innerHTML='<span style="color:var(--c-text-3);font-size:.85rem">Vista previa aquí…</span>'; return; }
  box.innerHTML = '';
  if (window.katex) { try { katex.render(latex,box,{throwOnError:false,displayMode:true}); return; } catch (_) {} }
  box.textContent = latex;
}
function agregarEjManual() {
  const latex  = document.getElementById('mctrl-ej-latex').value.trim();
  const resp   = document.getElementById('mctrl-ej-resp').value.trim();
  const op     = document.getElementById('mctrl-ej-op').value;
  const conj   = document.getElementById('mctrl-ej-conj').value;
  if (!latex) { toast('Escribe el LaTeX del ejercicio','error'); return; }
  T.ejManuales.push({ id:'ej_'+Date.now(), latex, respuesta_correcta:resp, operacion:op, conjunto:conj, is_manual:true });
  document.getElementById('mctrl-ej-latex').value = '';
  document.getElementById('mctrl-ej-resp').value  = '';
  document.getElementById('latex-preview').innerHTML = '<span style="color:var(--c-text-3);font-size:.85rem">Vista previa aquí…</span>';
  renderEjManuales();
}
function eliminarEjManual(idx) { T.ejManuales.splice(idx,1); renderEjManuales(); }
function renderEjManuales() {
  const list = document.getElementById('ej-manual-list');
  document.getElementById('ej-count').textContent = T.ejManuales.length;
  if (!T.ejManuales.length) {
    list.innerHTML='<div style="color:var(--c-text-3);font-size:.84rem;text-align:center;padding:.75rem">Sin ejercicios aún</div>';
    return;
  }
  list.innerHTML = T.ejManuales.map((ej,i) => `
    <div class="ej-manual-item">
      <span class="ej-manual-num">${i+1}.</span>
      <div class="ej-manual-latex" id="ejprev-${i}"></div>
      <span class="ej-manual-ans">${ej.respuesta_correcta||'?'}</span>
      <button class="btn btn-danger btn-xs" onclick="eliminarEjManual(${i})">✕</button>
    </div>`).join('');
  T.ejManuales.forEach((ej,i) => {
    const el = document.getElementById(`ejprev-${i}`); if (!el) return;
    if (window.katex) { try { katex.render(ej.latex,el,{throwOnError:false,displayMode:false}); return; } catch (_) {} }
    el.textContent = ej.latex;
  });
}

/* ═══════════════════════════════════════════════════════════
   PANEL: ÚLTIMOS RESULTADOS
═══════════════════════════════════════════════════════════ */
function llenarFiltrosUlt() {
  const sel = document.getElementById('uf-curso');
  sel.innerHTML = '<option value="">Selecciona un curso…</option>' +
    T.cursos.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
}

async function onUltCursoChange() {
  const cursoId = document.getElementById('uf-curso').value;
  if (!cursoId) return;
  // Llenar selector de controles del curso
  const ctrls = T.controles.filter(c=>(c.cursos_ids||[c.curso_id]).includes(cursoId))
    .sort((a,b)=>new Date(b.fecha_creacion)-new Date(a.fecha_creacion));
  document.getElementById('uf-control').innerHTML =
    '<option value="">Último control (automático)</option>' +
    ctrls.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
  await cargarUltResultados();
}

async function cargarUltResultados() {
  const cursoId   = document.getElementById('uf-curso').value;
  const controlId = document.getElementById('uf-control').value;
  const opFilter  = document.getElementById('uf-op').value;
  const conjFilter = document.getElementById('uf-conj').value;
  if (!cursoId) return;

  document.getElementById('ult-empty').style.display    = 'none';
  document.getElementById('ult-metrics').style.display  = 'none';
  document.getElementById('ult-export-bar').style.display = 'none';
  document.getElementById('escala-wrap').style.display   = 'none';

  try {
    const data = await API.get('getResultados', { cursoId, controlId });
    let rows   = data.respuestas || [];
    // Preset: si no hay controlId, usar último control automáticamente
    let ctrlIdUsado = controlId;
    if (!controlId && data.ultimoControl) {
      ctrlIdUsado = data.ultimoControl.id;
      rows = rows.filter(r=>r.control_id===ctrlIdUsado);
    }
    if (opFilter)   rows = rows.filter(r=>r.operacion===opFilter);
    if (conjFilter) rows = rows.filter(r=>r.conjunto ===conjFilter);

    if (!rows.length) { document.getElementById('ult-empty').style.display='block'; return; }

    T.ultRows = rows;
    document.getElementById('escala-wrap').style.display    = 'block';
    document.getElementById('ult-export-bar').style.display = 'flex';
    actualizarEscala();
    renderUltMetrics(rows);
    renderChartOps(rows,'ch-ult-ops');
    renderChartConj(rows,'ch-ult-conj');
    renderChartDist(rows,'ch-ult-dist');
    renderTablaUlt(rows);
  } catch (e) { toast('Error: '+e.message,'error'); }
}

function setView(v) {
  document.getElementById('view-graficos-ult').style.display = v==='graficos'?'block':'none';
  document.getElementById('view-tabla-ult').style.display    = v==='tabla'?'block':'none';
  document.getElementById('vbtn-graficos').classList.toggle('active', v==='graficos');
  document.getElementById('vbtn-tabla').classList.toggle('active',    v==='tabla');
}

function actualizarEscala() {
  T.escala = {
    notaMin:         parseFloat(document.getElementById('esc-min')?.value)  || 1,
    notaMax:         parseFloat(document.getElementById('esc-max')?.value)  || 7,
    notaAprobacion:  parseFloat(document.getElementById('esc-apro')?.value) || 4,
    pctAprobacion:   parseFloat(document.getElementById('esc-pct')?.value)  || 60,
  };
  const pv = document.getElementById('escala-preview');
  if (pv) {
    const n0   = calcularNota(0,   T.escala);
    const nApr = calcularNota(T.escala.pctAprobacion, T.escala);
    const n100 = calcularNota(100, T.escala);
    pv.textContent = `0% → ${n0} · ${T.escala.pctAprobacion}% → ${nApr} (aprobación) · 100% → ${n100}`;
  }
  if (T.ultRows.length) renderTablaUlt(T.ultRows);
}

function calcularNota(pct, escala) {
  const {notaMin:nMin, notaMax:nMax, notaAprobacion:nApro, pctAprobacion:pApro} = escala;
  let nota;
  if (pct >= pApro) nota = nApro + (nMax-nApro)*((pct-pApro)/(100-pApro));
  else              nota = nMin  + (nApro-nMin)*(pct/pApro);
  return Math.round(nota*10)/10;
}

function notaClass(nota) {
  if (nota >= 6.5) return 'nota-7';
  if (nota >= T.escala.notaAprobacion) return 'nota-alta';
  if (nota >= T.escala.notaAprobacion - 0.9) return 'nota-med';
  return 'nota-baja';
}

function renderUltMetrics(rows) {
  const total     = rows.length;
  const correctas = rows.filter(r=>esCorrecta(r)).length;
  const pct       = total ? Math.round(correctas/total*100) : 0;
  const ests      = new Set(rows.map(r=>r.rut||r.estudiante)).size;
  const notaPromedio = calcularNota(pct, T.escala);
  const el = document.getElementById('ult-metrics');
  el.style.display = 'grid';
  el.innerHTML = `
    <div class="metric-card m-primary"><div class="metric-label">Estudiantes</div><div class="metric-value">${ests}</div></div>
    <div class="metric-card m-success"><div class="metric-label">% Correcto</div><div class="metric-value">${pct}%</div></div>
    <div class="metric-card m-accent"><div class="metric-label">Nota promedio</div><div class="metric-value">${notaPromedio}</div></div>
    <div class="metric-card"><div class="metric-label">Total resp.</div><div class="metric-value">${total}</div></div>`;
}

function renderTablaUlt(rows) {
  const byKey = {};
  rows.forEach(r => {
    const key = `${r.rut||r.estudiante}__${r.control_id}`;
    if (!byKey[key]) byKey[key] = { est:r.estudiante, rut:r.rut||'', curso:r.curso_nombre||'—', ctrl:r.control_nombre||'—', t:0, c:0, tiempo:r.tiempo_usado };
    byKey[key].t++;
    if (esCorrecta(r)) byKey[key].c++;
  });
  const tbody = document.getElementById('ult-tbody');
  tbody.innerHTML = Object.values(byKey).map(g => {
    const pct  = Math.round(g.c/g.t*100);
    const nota = calcularNota(pct, T.escala);
    const nc   = notaClass(nota);
    const col  = pct>=70?'var(--c-success)':pct>=40?'var(--c-accent)':'var(--c-danger)';
    return `<tr>
      <td>${g.est}</td>
      <td class="td-mono">${formatRut(g.rut)}</td>
      <td>${g.curso}</td><td>${g.ctrl}</td>
      <td>${g.c}</td><td>${g.t}</td>
      <td><strong style="color:${col}">${pct}%</strong></td>
      <td><strong class="nota-cell ${nc}">${nota}</strong></td>
      <td class="td-mono">${g.tiempo?fmtTime(parseInt(g.tiempo)):'—'}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--c-text-3)">Sin datos</td></tr>`;
}

function esCorrecta(r) { return r.es_correcta==true||r.es_correcta==='true'; }

/* ═══════════════════════════════════════════════════════════
   MULTI-SELECT  (Resultados Generales)
═══════════════════════════════════════════════════════════ */
const MS_OPTIONS = {
  'ms-ops':   Object.entries(OP_NAMES).map(([v,l])=>({value:v,label:l})),
  'ms-conjs': Object.entries(CONJ_NAMES).map(([v,l])=>({value:v,label:l})),
};

function initMultiselects() {
  // ops y conjs son fijos; cursos y controles se llenan dinámicamente
  ['ms-ops','ms-conjs'].forEach(id => {
    const drop = document.getElementById(`${id}-drop`);
    if (!drop) return;
    drop.innerHTML = MS_OPTIONS[id].map(o=>msOptionHTML(id,o.value,o.label)).join('');
  });
}

function llenarFiltrosRG() {
  // Cursos
  const cursoDrop = document.getElementById('ms-cursos-drop');
  if (cursoDrop) cursoDrop.innerHTML = T.cursos.map(c=>msOptionHTML('ms-cursos',c.id,c.nombre)).join('');
  // Controles
  const ctrlDrop = document.getElementById('ms-ctrls-drop');
  if (ctrlDrop) ctrlDrop.innerHTML = T.controles.map(c=>msOptionHTML('ms-ctrls',c.id,c.nombre)).join('');
}

function msOptionHTML(msId, value, label) {
  return `<div class="ms-option" data-value="${value}" onclick="toggleMsOption('${msId}','${value}','${label}',this)">
    <div class="ms-option-check"></div>
    <span>${label}</span>
  </div>`;
}

function toggleMsOption(msId, value, label, el) {
  const state = T.msState[msId];
  const idx   = state.indexOf(value);
  if (idx >= 0) { state.splice(idx,1); el.classList.remove('selected'); }
  else          { state.push(value);   el.classList.add('selected'); }
  renderMsDisplay(msId);
}

function renderMsDisplay(msId) {
  const display = document.getElementById(`${msId}-display`);
  const state   = T.msState[msId];
  if (!state.length) {
    display.innerHTML = `<span class="ms-placeholder">${msFallbackLabel(msId)}</span>`;
    return;
  }
  // Resolve labels
  const labels = state.map(v => {
    if (msId==='ms-ops')  return OP_NAMES[v]   || v;
    if (msId==='ms-conjs') return CONJ_NAMES[v] || v;
    if (msId==='ms-cursos') return T.cursos.find(c=>c.id===v)?.nombre || v;
    if (msId==='ms-ctrls')  return T.controles.find(c=>c.id===v)?.nombre || v;
    return v;
  });
  display.innerHTML = labels.map(l =>
    `<span class="ms-chip">${l}<span class="ms-chip-x" onclick="removeMsOption('${msId}','${state[labels.indexOf(l)]}',event)">✕</span></span>`
  ).join('');
}

function removeMsOption(msId, value, event) {
  event.stopPropagation();
  const state = T.msState[msId];
  const idx   = state.indexOf(value);
  if (idx >= 0) state.splice(idx,1);
  // Deselect in dropdown
  const drop = document.getElementById(`${msId}-drop`);
  drop?.querySelectorAll(`.ms-option`).forEach(el => {
    if (el.dataset.value === value) el.classList.remove('selected');
  });
  renderMsDisplay(msId);
}

function msFallbackLabel(msId) {
  return {
    'ms-cursos':'Todos los cursos','ms-ctrls':'Todos los controles',
    'ms-ops':'Todas las operaciones','ms-conjs':'Todos los conjuntos'
  }[msId] || 'Todos';
}

function toggleMultiselect(msId) {
  const drop    = document.getElementById(`${msId}-drop`);
  const display = document.getElementById(`${msId}-display`);
  const isOpen  = drop.classList.contains('open');
  closeAllDropdowns();
  if (!isOpen) { drop.classList.add('open'); display.classList.add('open'); }
}
function closeAllDropdowns() {
  document.querySelectorAll('.multiselect-dropdown').forEach(d=>d.classList.remove('open'));
  document.querySelectorAll('.multiselect-display').forEach(d=>d.classList.remove('open'));
}

function limpiarFiltrosRG() {
  Object.keys(T.msState).forEach(k => { T.msState[k] = []; renderMsDisplay(k); });
  document.querySelectorAll('.ms-option').forEach(el=>el.classList.remove('selected'));
}

/* ═══════════════════════════════════════════════════════════
   PANEL: RESULTADOS GENERALES
═══════════════════════════════════════════════════════════ */
async function cargarResultadosGenerales() {
  closeAllDropdowns();
  const cursoIds   = T.msState['ms-cursos'];
  const controlIds = T.msState['ms-ctrls'];
  const ops        = T.msState['ms-ops'];
  const conjs      = T.msState['ms-conjs'];

  document.getElementById('rg-empty').style.display   = 'none';
  document.getElementById('rg-charts').style.display  = 'none';
  document.getElementById('rg-metrics').style.display = 'none';
  document.getElementById('rg-export-bar').style.display = 'none';

  try {
    const params = {};
    if (cursoIds.length)  params.cursoIds   = JSON.stringify(cursoIds);
    if (controlIds.length) params.controlIds = JSON.stringify(controlIds);

    const data = await API.get('getResultados', params);
    let rows   = data.respuestas || [];

    if (ops.length)   rows = rows.filter(r=>ops.includes(r.operacion));
    if (conjs.length) rows = rows.filter(r=>conjs.includes(r.conjunto));

    if (!rows.length) { document.getElementById('rg-empty').style.display='block'; return; }

    T.rgRows = rows;
    renderRGMetrics(rows);
    renderChartOps(rows,  'ch-rg-ops');
    renderChartConj(rows, 'ch-rg-conj');
    renderChartCursos(rows);
    renderChartDebiles(rows);
    document.getElementById('rg-charts').style.display     = 'block';
    document.getElementById('rg-export-bar').style.display = 'flex';
  } catch (e) { toast('Error: '+e.message,'error'); }
}

function renderRGMetrics(rows) {
  const total     = rows.length;
  const correctas = rows.filter(esCorrecta).length;
  const pct       = total ? Math.round(correctas/total*100) : 0;
  const ests      = new Set(rows.map(r=>r.rut||r.estudiante)).size;
  const cursos    = new Set(rows.map(r=>r.curso_nombre)).size;
  const el = document.getElementById('rg-metrics');
  el.style.display = 'grid';
  el.innerHTML = `
    <div class="metric-card m-primary"><div class="metric-label">Estudiantes</div><div class="metric-value">${ests}</div></div>
    <div class="metric-card m-success"><div class="metric-label">% Correcto</div><div class="metric-value">${pct}%</div></div>
    <div class="metric-card"><div class="metric-label">Respuestas</div><div class="metric-value">${total}</div></div>
    <div class="metric-card"><div class="metric-label">Cursos</div><div class="metric-value">${cursos}</div></div>`;
}

function renderChartCursos(rows) {
  const cursoMap = {};
  rows.forEach(r => {
    const c = r.curso_nombre||'—';
    if (!cursoMap[c]) cursoMap[c] = {t:0,c:0};
    cursoMap[c].t++;
    if (esCorrecta(r)) cursoMap[c].c++;
  });
  const labels = Object.keys(cursoMap);
  const data   = labels.map(l=>Math.round(cursoMap[l].c/cursoMap[l].t*100));
  const ctx    = document.getElementById('ch-rg-cursos').getContext('2d');
  destroyChart('rg-cursos');
  T.charts['rg-cursos'] = new Chart(ctx, {
    type:'bar',
    data: { labels, datasets:[{data, backgroundColor: PALETTE.slice(0,labels.length), borderRadius:6, borderSkipped:false}] },
    options: chartOpts('%',false)
  });
}

function renderChartDebiles(rows) {
  const skillMap = {};
  SKILLS.forEach(s => {
    const sub = rows.filter(r=>r.operacion===s.op&&r.conjunto===s.conj);
    if (sub.length) skillMap[s.lbl] = Math.round(sub.filter(esCorrecta).length/sub.length*100);
  });
  const sorted = Object.entries(skillMap).sort((a,b)=>a[1]-b[1]).slice(0,8);
  const labels = sorted.map(([l])=>l), data = sorted.map(([,v])=>v);
  const ctx = document.getElementById('ch-rg-debiles').getContext('2d');
  destroyChart('rg-debiles');
  T.charts['rg-debiles'] = new Chart(ctx, {
    type:'bar',
    data: { labels, datasets:[{data, backgroundColor:data.map(v=>v>=70?'#059669':v>=40?'#d97706':'#dc2626'), borderRadius:6, borderSkipped:false}] },
    options: chartOpts('%',false)
  });
}

/* ═══════════════════════════════════════════════════════════
   CHARTS COMPARTIDOS
═══════════════════════════════════════════════════════════ */
function renderChartOps(rows, canvasId) {
  const ops   = ['suma','resta','mult','div','pot','log','raiz'];
  const lbls  = ops.map(o=>OP_LABELS[o]||o);
  const data  = ops.map(op => {
    const sub = rows.filter(r=>r.operacion===op);
    return sub.length ? Math.round(sub.filter(esCorrecta).length/sub.length*100) : null;
  });
  const bgs = data.map(v=>v===null?'#e5e7eb':v>=70?'#059669':v>=40?'#d97706':'#dc2626');
  const ctx  = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;
  destroyChart(canvasId);
  T.charts[canvasId] = new Chart(ctx,{type:'bar',data:{labels:lbls,datasets:[{data,backgroundColor:bgs,borderRadius:6,borderSkipped:false}]},options:chartOpts('%',false)});
}

function renderChartConj(rows, canvasId) {
  const conjs = ['N','Z','Q'];
  const lbls  = conjs.map(c=>CONJ_LABELS[c]||c);
  const data  = conjs.map(c=>{const sub=rows.filter(r=>r.conjunto===c); return sub.length?Math.round(sub.filter(esCorrecta).length/sub.length*100):null;});
  const ctx   = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;
  destroyChart(canvasId);
  T.charts[canvasId] = new Chart(ctx,{type:'bar',data:{labels:lbls,datasets:[{data,backgroundColor:['#818cf8','#34d399','#fbbf24'],borderRadius:6,borderSkipped:false}]},options:chartOpts('%',false)});
}

function renderChartDist(rows, canvasId) {
  const byEst = {};
  rows.forEach(r=>{const k=r.rut||r.estudiante;if(!byEst[k])byEst[k]={t:0,c:0};byEst[k].t++;if(esCorrecta(r))byEst[k].c++;});
  const scores = Object.values(byEst).map(s=>Math.round(s.c/s.t*100));
  const counts = new Array(10).fill(0);
  scores.forEach(s=>counts[Math.min(Math.floor(s/10),9)]++);
  const lbls = ['0–9','10–19','20–29','30–39','40–49','50–59','60–69','70–79','80–89','90–100'].map(l=>l+'%');
  const ctx  = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;
  destroyChart(canvasId);
  T.charts[canvasId] = new Chart(ctx,{type:'bar',data:{labels:lbls,datasets:[{label:'Estudiantes',data:counts,backgroundColor:'#818cf8',borderRadius:4,borderSkipped:false}]},options:chartOpts('',false)});
}

/* ═══════════════════════════════════════════════════════════
   PANEL: PROGRESIÓN v2.0
═══════════════════════════════════════════════════════════ */
function llenarFiltrosProgresion() {
  ['pg-curso','pg-est-curso'].forEach(id => {
    const sel = document.getElementById(id); if (!sel) return;
    sel.innerHTML = '<option value="">Selecciona un curso</option>' +
      T.cursos.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
  });
}

function setProgMode(mode) {
  T.progMode = mode;
  document.getElementById('prog-mode-curso').style.display      = mode==='curso'      ? 'block' : 'none';
  document.getElementById('prog-mode-estudiante').style.display = mode==='estudiante' ? 'block' : 'none';
  document.getElementById('mode-tab-curso').classList.toggle('active',      mode==='curso');
  document.getElementById('mode-tab-estudiante').classList.toggle('active', mode==='estudiante');
}

function showProgTab(tab, btn, mode) {
  const prefix   = mode==='curso' ? '' : '';
  const tabsId   = mode==='curso' ? '#prog-curso-tabs' : '#prog-est-tabs';
  const panelIds = mode==='curso'
    ? ['prog-tab-heatmap','prog-tab-lineas','prog-tab-riesgo']
    : ['prog-tab-perfil','prog-tab-historial'];
  panelIds.forEach(id => { document.getElementById(id)?.classList.remove('active'); });
  document.querySelectorAll(`${tabsId} .tab-btn`).forEach(b=>b.classList.remove('active'));
  document.getElementById(`prog-tab-${tab}`)?.classList.add('active');
  btn?.classList.add('active');
}

/* ── MODO CURSO ─────────────────────────────────────────── */
async function onProgCursoChange() {
  const cursoId = document.getElementById('pg-curso').value; if (!cursoId) return;
  const ctrls   = T.controles.filter(c=>(c.cursos_ids||[c.curso_id]).includes(cursoId));
  const slider  = document.getElementById('pg-slider');
  slider.max    = Math.max(ctrls.length,1); slider.value = slider.max;
  onProgSlider(slider.value);
  await cargarProgresion();
}

function onProgSlider(val) {
  const max = document.getElementById('pg-slider').max;
  document.getElementById('pg-slider-val').textContent = val==max ? 'Todos' : `Últimos ${val}`;
}

async function cargarProgresion() {
  const cursoId = document.getElementById('pg-curso').value; if (!cursoId) return;
  const limite  = document.getElementById('pg-slider').value;
  try {
    const data = await API.get('getProgresion', { cursoId, limite });
    T.progData = data;
    renderHeatmap(data);
    renderLineas(data);
    renderEnRiesgo(data);
  } catch (e) { toast('Error: '+e.message,'error'); }
}

function renderHeatmap(data) {
  const canvas     = document.getElementById('heatmap-canvas');
  const ctx        = canvas.getContext('2d');
  const claves     = data.estudiantes || [];
  const nombresEst = data.nombresEst  || {};
  const heatmap    = data.heatmap     || {};
  if (!claves.length) {
    canvas.width=400; canvas.height=80; ctx.clearRect(0,0,400,80);
    ctx.fillStyle='#9ca3af'; ctx.font='13px Outfit,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Sin datos para el curso seleccionado',200,45); return;
  }
  const skillsPresent = SKILLS.filter(s=>claves.some(k=>heatmap[k]?.[s.id]!==undefined));
  if (!skillsPresent.length) return;
  const CW=48,CH=30,LP=145,TP=44,GAP=2;
  canvas.width  = LP + skillsPresent.length*(CW+GAP)+20;
  canvas.height = TP + claves.length*(CH+GAP)+20;
  canvas.style.minWidth = canvas.width+'px';
  document.getElementById('heatmap-info').textContent =
    `${claves.length} estudiantes · ${skillsPresent.length} habilidades`;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Headers
  ctx.font='11px Outfit,sans-serif'; ctx.fillStyle='#9ca3af'; ctx.textAlign='center';
  skillsPresent.forEach((s,si)=>ctx.fillText(s.lbl, LP+si*(CW+GAP)+CW/2, TP-10));
  // Rows
  claves.forEach((clave,ei) => {
    const y    = TP+ei*(CH+GAP);
    const nom  = nombresEst[clave] || clave;
    ctx.fillStyle='#374151'; ctx.textAlign='right'; ctx.font='11px Outfit,sans-serif';
    ctx.fillText(nom.length>20?nom.slice(0,19)+'…':nom, LP-8, y+CH/2+4);
    skillsPresent.forEach((s,si)=>{
      const x = LP+si*(CW+GAP);
      const v = heatmap[clave]?.[s.id];
      if (v===undefined||v===null) {
        ctx.fillStyle='#f3f4f6'; ctx.fillRect(x,y,CW,CH);
        ctx.fillStyle='#d1d5db'; ctx.font='11px Outfit,sans-serif'; ctx.textAlign='center';
        ctx.fillText('—',x+CW/2,y+CH/2+4);
      } else {
        ctx.fillStyle=heatmapColor(v); ctx.fillRect(x,y,CW,CH);
        ctx.fillStyle=v>55?'#064e3b':v>30?'#451a03':'#7f1d1d';
        ctx.font='11px Outfit,sans-serif'; ctx.textAlign='center';
        ctx.fillText(Math.round(v)+'%',x+CW/2,y+CH/2+4);
      }
    });
  });
}
function heatmapColor(pct) {
  if (pct>=70) return `hsl(142,${50+pct/4}%,${88-pct/8}%)`;
  if (pct>=40) return `hsl(45,90%,75%)`;
  return `hsl(${pct/2},75%,88%)`;
}

function renderLineas(data) {
  const series = data.series||[]; if (!series.length) return;
  const sliderVal = parseInt(document.getElementById('pg-slider').value)||99;
  const cortadas  = series.map(s=>({...s, puntos:s.puntos.slice(-sliderVal)}));
  const labels    = cortadas[0]?.puntos.map(p=>p.control)||[];
  const ctx = document.getElementById('ch-lines').getContext('2d');
  destroyChart('lines');
  T.charts['lines'] = new Chart(ctx,{
    type:'line',
    data:{labels, datasets:cortadas.map((s,i)=>({
      label:s.nombre, data:s.puntos.map(p=>p.pct),
      borderColor:PALETTE[i%PALETTE.length], backgroundColor:PALETTE[i%PALETTE.length]+'22',
      borderWidth:2, pointRadius:4, pointHoverRadius:6, tension:.35, fill:series.length===1
    }))},
    options:{...chartOpts('%',true), scales:{y:{min:0,max:100,ticks:{callback:v=>v+'%',font:{size:11}},grid:{color:'#f3f4f6'}},x:{grid:{display:false},ticks:{font:{size:11}}}}}
  });
}

function renderEnRiesgo(data) {
  const wrap = document.getElementById('riesgo-list-wrap');
  const riesgo = data.enRiesgo||[];
  if (!riesgo.length) {
    wrap.innerHTML='<div class="empty-state"><div class="empty-icon">✅</div><h4>Sin estudiantes en riesgo</h4><p>Ningún estudiante tiene tendencia a la baja en los últimos 3 controles</p></div>';
    return;
  }
  wrap.innerHTML = `<div class="riesgo-list">${riesgo.map(n=>`
    <div class="riesgo-item">⚠ ${n} — tendencia a la baja en los últimos 3 controles</div>`).join('')}</div>`;
}

/* ── MODO ESTUDIANTE ─────────────────────────────────────── */
async function onProgEstCursoChange() {
  const cursoId = document.getElementById('pg-est-curso').value; if (!cursoId) return;
  const ests    = await cargarEstudiantes(cursoId);
  const sel     = document.getElementById('pg-est-selector');
  sel.innerHTML = '<option value="">— elige un estudiante —</option>' +
    ests.map(e=>`<option value="${e.rut}">${e.nombre} ${e.apellido}</option>`).join('');
}

async function cargarProgresionEst() {
  const cursoId   = document.getElementById('pg-est-curso').value;
  const estudRut  = document.getElementById('pg-est-selector').value;
  if (!cursoId || !estudRut) return;
  try {
    const data = await API.get('getProgresion', { cursoId, estudiante: estudRut });
    const serie = (data.series||[]).find(s=>s.clave===estudRut);
    const hRow  = data.heatmap?.[estudRut]||{};
    renderPerfilEstudiante(serie, hRow);
    renderHistorialEstudiante(serie);
  } catch (e) { toast('Error: '+e.message,'error'); }
}

function renderPerfilEstudiante(serie, hRow) {
  const wrap = document.getElementById('perfil-wrap');
  if (!serie) { wrap.innerHTML='<div class="empty-state"><div class="empty-icon">📊</div><h4>Sin datos</h4></div>'; return; }
  const puntos = serie.puntos||[];
  const prom   = puntos.length ? Math.round(puntos.reduce((a,p)=>a+p.pct,0)/puntos.length) : 0;
  const chipsHTML = SKILLS.map(s=>{
    const v=hRow[s.id]; if(v===undefined) return '';
    const bg=v>=70?'#d1fae5':v>=40?'#fef3c7':'#fee2e2';
    const tc=v>=70?'#065f46':v>=40?'#92400e':'#991b1b';
    return `<div class="skill-chip" style="background:${bg};color:${tc}"><div class="sc-pct">${Math.round(v)}%</div><div class="sc-label">${s.lbl}</div></div>`;
  }).join('');
  wrap.innerHTML = `
    <div class="metrics-grid mb-md">
      <div class="metric-card m-primary"><div class="metric-label">Promedio general</div><div class="metric-value">${prom}%</div></div>
      <div class="metric-card"><div class="metric-label">Controles rendidos</div><div class="metric-value">${puntos.length}</div></div>
    </div>
    <div class="card"><div class="card-header"><div class="card-title">Habilidades — ${serie.nombre}</div></div>
    <div class="skill-chips">${chipsHTML||'<span style="color:var(--c-text-3);font-size:.85rem">Sin datos de habilidades</span>'}</div></div>`;
}

function renderHistorialEstudiante(serie) {
  const wrap = document.getElementById('historial-wrap');
  if (!serie||!serie.puntos?.length) {
    wrap.innerHTML='<div class="empty-state"><div class="empty-icon">📅</div><h4>Sin historial</h4></div>'; return;
  }
  const rows = serie.puntos.map((p,i)=>{
    const prev=i>0?serie.puntos[i-1].pct:null;
    const tr=prev===null?'—':p.pct>prev?'↑':p.pct<prev?'↓':'→';
    const tc=tr==='↑'?'var(--c-success)':tr==='↓'?'var(--c-danger)':'var(--c-text-3)';
    return `<tr><td>${p.control}</td><td><strong>${Math.round(p.pct)}%</strong></td><td style="font-size:1.2rem;color:${tc};font-weight:700">${tr}</td></tr>`;
  }).join('');
  wrap.innerHTML = `<div class="card"><div class="card-header"><div class="card-title">Historial de controles — ${serie.nombre}</div></div>
    <div class="table-wrap"><table><thead><tr><th>Control</th><th>% Correcto</th><th>Tendencia</th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>`;
}

/* ═══════════════════════════════════════════════════════════
   EXPORTACIONES
═══════════════════════════════════════════════════════════ */
function descargarCSV(rows, nombre) {
  const csv  = rows.map(r=>r.map(c=>typeof c==='string'&&c.includes(',') ? `"${c}"` : c).join(',')).join('\n');
  const blob = new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${nombre}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function exportarCSV(panel) {
  const rows = panel==='ult' ? T.ultRows : T.rgRows;
  if (!rows.length) { toast('Sin datos para exportar','error'); return; }

  const byKey = {};
  rows.forEach(r=>{
    const key=`${r.rut||r.estudiante}__${r.control_id}`;
    if(!byKey[key]) byKey[key]={est:r.estudiante,rut:r.rut||'',curso:r.curso_nombre||'—',ctrl:r.control_nombre||'—',t:0,c:0,tiempo:r.tiempo_usado};
    byKey[key].t++; if(esCorrecta(r)) byKey[key].c++;
  });

  const headers = ['Estudiante','RUT','Curso','Control','Correctas','Total','%','Nota','Tiempo'];
  const data    = Object.values(byKey).map(g=>{
    const pct  = Math.round(g.c/g.t*100);
    const nota = calcularNota(pct, T.escala);
    return [g.est, formatRut(g.rut), g.curso, g.ctrl, g.c, g.t, pct+'%', nota, g.tiempo?fmtTime(parseInt(g.tiempo)):'—'];
  });

  descargarCSV([headers,...data], `resultados_${panel}`);
  toast('CSV descargado ✓','success');
}

function copiarTabla(panel) {
  const tbodyId = panel==='ult' ? 'ult-tbody' : null;
  if (!tbodyId) return;
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const text = Array.from(tbody.querySelectorAll('tr')).map(tr =>
    Array.from(tr.querySelectorAll('td')).map(td=>td.textContent.trim()).join('\t')
  ).join('\n');
  navigator.clipboard?.writeText(text).then(()=>toast('Tabla copiada al portapapeles ✓','success'));
}

function imprimirPanel(panelId) {
  // Marcar panel activo para impresión
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('print-active'));
  document.getElementById(panelId)?.classList.add('print-active');
  window.print();
  setTimeout(()=>document.getElementById(panelId)?.classList.remove('print-active'),1000);
}

function exportarProgresion(mode) {
  if (!T.progData) { toast('Carga los datos primero','error'); return; }
  const series = T.progData.series||[];
  if (!series.length) { toast('Sin datos para exportar','error'); return; }

  if (mode==='curso') {
    const headers = ['Estudiante','Control','% Correcto'];
    const data    = [];
    series.forEach(s=>s.puntos.forEach(p=>data.push([s.nombre,p.control,p.pct+'%'])));
    descargarCSV([headers,...data],'progresion_curso');
  } else {
    const clave   = document.getElementById('pg-est-selector')?.value;
    const serie   = series.find(s=>s.clave===clave);
    if (!serie) { toast('Selecciona un estudiante','error'); return; }
    const headers = ['Control','% Correcto'];
    const data    = serie.puntos.map(p=>[p.control,p.pct+'%']);
    descargarCSV([headers,...data],`progresion_${serie.nombre.replace(/\s+/g,'_')}`);
  }
  toast('CSV descargado ✓','success');
}
