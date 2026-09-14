let customData = [];
let ALL = [];

const COLORS = ['#1B2A5B','#F2B705','#3B4E8F','#C98A02','#6B7CB0','#E8C34D','#253972','#A9760A'];

const fmtDate = s => {
  if(!s) return '—';
  const d = new Date(s);
  if(isNaN(d)) return s;
  return d.toLocaleDateString('es-CO', {day:'2-digit', month:'short', year:'numeric'});
};
function uniq(arr){ return [...new Set(arr)].filter(Boolean).sort(); }
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2600);
}

const LS_KEY = 'uae-pantallas-custom-screens-v1';
const SHEETS_MODE = !!(typeof CONFIG !== 'undefined' && CONFIG.SHEET_API_URL && CONFIG.SHEET_API_URL.trim());

async function loadCustomLocal(){
  try{
    if(window.storage){
      const res = await window.storage.get('custom-screens-v1', false);
      return res && res.value ? JSON.parse(res.value) : [];
    }
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
async function saveCustomLocal(){
  try{
    if(window.storage){
      await window.storage.set('custom-screens-v1', JSON.stringify(customData), false);
      return;
    }
    localStorage.setItem(LS_KEY, JSON.stringify(customData));
  }catch(e){ console.error('No se pudo guardar', e); }
}

/** Carga todos los registros: desde Google Sheets si está configurado, si no desde el JSON local + localStorage. */
async function loadAllData(){
  if(SHEETS_MODE){
    try{
      const resp = await fetch(CONFIG.SHEET_API_URL);
      if(!resp.ok) throw new Error('HTTP ' + resp.status);
      const rows = await resp.json();
      return Array.isArray(rows) ? rows : [];
    }catch(e){
      console.error('No se pudo leer Google Sheets, usando copia local:', e);
      showToast('No se pudo conectar con Google Sheets — mostrando datos locales');
    }
  }
  let base = [];
  try{
    const resp = await fetch('data/pantallas.json');
    if(resp.ok) base = await resp.json();
  }catch(e){ console.error(e); }
  customData = await loadCustomLocal();
  return [...base, ...customData];
}

/** Guarda una pantalla nueva: en Google Sheets si está configurado, si no en localStorage. */
async function saveNewEntry(entry){
  if(SHEETS_MODE){
    try{
      // Content-Type text/plain evita el preflight CORS que Apps Script no maneja bien.
      const resp = await fetch(CONFIG.SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(entry)
      });
      const result = await resp.json();
      if(!result.ok) throw new Error(result.error || 'Error desconocido');
      return true;
    }catch(e){
      console.error('No se pudo guardar en Google Sheets:', e);
      showToast('No se pudo guardar en Google Sheets, revisa la conexión');
      return false;
    }
  }
  customData.push(entry);
  await saveCustomLocal();
  return true;
}

let state = { search:'', bloque:'todos', modelo:'todos', pulgadas:'todos', anio:'todos', sortKey:'bloque', sortDir:1 };

function escAttr(str){ return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;'); }

function populateSelects(){
  document.getElementById('filterBloque').innerHTML = '<option value="todos">Todos los bloques</option>' +
    uniq(ALL.map(d=>d.bloque)).map(b=>`<option value="${escAttr(b)}">${b.trim()}</option>`).join('');
  document.getElementById('filterModelo').innerHTML = '<option value="todos">Todos los modelos</option>' +
    uniq(ALL.map(d=>d.modelo)).map(m=>`<option value="${escAttr(m)}">${m}</option>`).join('');
  document.getElementById('filterPulgadas').innerHTML = '<option value="todos">Todas las pulgadas</option>' +
    uniq(ALL.map(d=>d.pulgadas)).map(m=>`<option value="${escAttr(m)}">${m}</option>`).join('');
  document.getElementById('filterAnio').innerHTML = '<option value="todos">Todos los años</option>' +
    uniq(ALL.map(d=>d.anio)).sort().map(m=>`<option value="${m}">${m}</option>`).join('');
}

function applyFilters(){
  let rows = ALL.filter(d=>{
    if(state.bloque!=='todos' && d.bloque!==state.bloque) return false;
    if(state.modelo!=='todos' && d.modelo!==state.modelo) return false;
    if(state.pulgadas!=='todos' && d.pulgadas!==state.pulgadas) return false;
    if(state.anio!=='todos' && d.anio!==state.anio) return false;
    if(state.search){
      const s = state.search.toLowerCase();
      const hay = [d.salon,d.serial_pantalla,d.activo_fijo_pantalla,d.modelo,d.bloque,d.serial_ops]
        .filter(Boolean).join(' ').toLowerCase();
      if(!hay.includes(s)) return false;
    }
    return true;
  });
  rows.sort((a,b)=>{
    let va = a[state.sortKey] ?? '';
    let vb = b[state.sortKey] ?? '';
    return va > vb ? state.sortDir : va < vb ? -state.sortDir : 0;
  });
  return rows;
}

function renderTable(){
  const rows = applyFilters();
  const tbody = document.getElementById('tbody');
  const empty = document.getElementById('empty');
  if(rows.length===0){
    tbody.innerHTML=''; empty.style.display='block';
  } else {
    empty.style.display='none';
    tbody.innerHTML = rows.map(d=>`
      <tr data-id="${d.id}">
        <td>${d.bloque ? d.bloque.trim() : '—'}</td>
        <td><strong>${d.salon||'—'}</strong>${d.custom?'<span class="tag-new">nuevo</span>':''}</td>
        <td>${d.pulgadas||'—'}</td>
        <td>${d.modelo||'—'}</td>
        <td>${d.anio||'—'}</td>
        <td>${d.activo_fijo_pantalla||'—'}</td>
      </tr>`).join('');
    tbody.querySelectorAll('tr').forEach(tr=>{
      tr.addEventListener('click', ()=>openDetail(tr.dataset.id));
    });
  }
  document.getElementById('count-info').textContent = `Mostrando ${rows.length} de ${ALL.length} registros`;
}

function sparkline(el, values, color){
  if(values.length<2){ el.innerHTML=''; return; }
  const w=160,h=34,max=Math.max(...values),min=Math.min(...values);
  const range = (max-min)||1;
  const pts = values.map((v,i)=> `${(i/(values.length-1))*w},${h-((v-min)/range)*h}`).join(' ');
  const areaPts = `0,${h} ${pts} ${w},${h}`;
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="none">
    <polygon points="${areaPts}" fill="${color}22"></polygon>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
  </svg>`;
}

function updateKPIs(){
  const total = ALL.length;
  const blocks = uniq(ALL.map(d=>d.bloque)).length;
  const models = uniq(ALL.map(d=>d.modelo)).length;

  const sizeCounts = {};
  ALL.forEach(d=>{ if(d.pulgadas) sizeCounts[d.pulgadas] = (sizeCounts[d.pulgadas]||0)+1; });
  const topSize = Object.entries(sizeCounts).sort((a,b)=>b[1]-a[1])[0];

  document.getElementById('kpi-total').textContent = total;
  document.getElementById('kpi-blocks').textContent = blocks;
  document.getElementById('kpi-models').textContent = models;
  document.getElementById('kpi-size').textContent = topSize ? topSize[0] : '—';

  const dated = ALL.filter(d=>d.fecha_instalacion).sort((a,b)=> new Date(a.fecha_instalacion)-new Date(b.fecha_instalacion));
  let cum = 0;
  const series = dated.map(d=> ++cum);
  sparkline(document.getElementById('spark-total'), series.length?series:[0,total], '#1B2A5B');
  sparkline(document.getElementById('spark-blocks'), Array.from({length:blocks},(_,i)=>i+1), '#1B2A5B');
  sparkline(document.getElementById('spark-models'), Array.from({length:models},(_,i)=>i+1), '#F2B705');
  const sizeVals = Object.values(sizeCounts).sort((a,b)=>a-b);
  sparkline(document.getElementById('spark-size'), sizeVals.length>1?sizeVals:[0,...sizeVals], '#C98A02');
}

function openDetail(id){
  const d = ALL.find(x=>String(x.id)===String(id));
  if(!d) return;
  const fields = [
    ['Bloque / Zona', d.bloque],
    ['Salón', d.salon],
    ['Pulgadas', d.pulgadas],
    ['Modelo', d.modelo],
    ['Año', d.anio],
    ['Activo Fijo — Pantalla', d.activo_fijo_pantalla],
    ['Serial — Pantalla', d.serial_pantalla],
    ['Accesorios', d.accesorios],
    ['Fecha Instalación', fmtDate(d.fecha_instalacion)],
    ['Serial — OPS', d.serial_ops],
    ['Características OPS', d.caracteristicas_ops],
    ['Activo Fijo — UPS', d.activo_fijo_ups],
    ['Observaciones', d.observaciones],
    ['Link de reporte', d.reporte_link ? `<a class="dl-link" href="${d.reporte_link}" target="_blank" rel="noopener">Ver carpeta en Drive ↗</a>` : null],
  ];
  document.getElementById('detail-content').innerHTML = `
    <h3>Salón ${d.salon||'—'}</h3>
    <div class="panel-sub">${d.bloque ? d.bloque.trim() : ''}${d.custom?' · registro nuevo':''}</div>
    <div class="dl">
      ${fields.map(([k,v])=>`<div class="row"><div class="k">${k}</div><div class="v">${v||'—'}</div></div>`).join('')}
    </div>`;
  document.getElementById('detail').classList.add('open');
  document.getElementById('overlay').classList.add('open');
}
function closeAllPanels(){
  document.getElementById('detail').classList.remove('open');
  document.getElementById('formPanel').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}
document.getElementById('closeDetail').addEventListener('click', closeAllPanels);
document.getElementById('closeForm').addEventListener('click', closeAllPanels);
document.getElementById('cancelForm').addEventListener('click', closeAllPanels);
document.getElementById('overlay').addEventListener('click', closeAllPanels);
document.getElementById('btnAdd').addEventListener('click', ()=>{
  document.getElementById('formPanel').classList.add('open');
  document.getElementById('overlay').classList.add('open');
});

document.getElementById('search').addEventListener('input', e=>{ state.search=e.target.value; renderTable(); });
document.getElementById('filterBloque').addEventListener('change', e=>{ state.bloque=e.target.value; renderTable(); });
document.getElementById('filterModelo').addEventListener('change', e=>{ state.modelo=e.target.value; renderTable(); });
document.getElementById('filterPulgadas').addEventListener('change', e=>{ state.pulgadas=e.target.value; renderTable(); });
document.getElementById('filterAnio').addEventListener('change', e=>{ state.anio=e.target.value; renderTable(); });
document.querySelectorAll('thead th[data-key]').forEach(th=>{
  th.addEventListener('click', ()=>{
    const key = th.dataset.key;
    if(state.sortKey===key){ state.sortDir *= -1; } else { state.sortKey=key; state.sortDir=1; }
    renderTable();
  });
});
document.getElementById('btnReset').addEventListener('click', ()=>{
  state = { search:'', bloque:'todos', modelo:'todos', pulgadas:'todos', anio:'todos', sortKey:'bloque', sortDir:1 };
  document.getElementById('search').value='';
  ['filterBloque','filterModelo','filterPulgadas','filterAnio'].forEach(id=>document.getElementById(id).value='todos');
  renderTable();
});
document.getElementById('btnExport').addEventListener('click', ()=>{
  const rows = applyFilters();
  const headers = ['ID','Bloque','Salon','Pulgadas','Modelo','Anio','ActivoFijoPantalla','SerialPantalla','FechaInstalacion'];
  const csv = [headers.join(',')].concat(rows.map(d=>[
    d.id, JSON.stringify(d.bloque||''), JSON.stringify(d.salon||''), d.pulgadas||'',
    d.modelo||'', d.anio||'', d.activo_fijo_pantalla||'', d.serial_pantalla||'', d.fecha_instalacion||''
  ].join(','))).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'inventario_pantallas.csv';
  a.click();
});

document.getElementById('addForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const fecha = document.getElementById('f-fecha').value;
  const newEntry = {
    id: 'custom-' + Date.now(),
    bloque: document.getElementById('f-bloque').value.trim(),
    salon: document.getElementById('f-salon').value.trim(),
    pulgadas: document.getElementById('f-pulgadas').value || null,
    modelo: document.getElementById('f-modelo').value.trim() || null,
    activo_fijo_pantalla: document.getElementById('f-activo').value.trim() || null,
    serial_pantalla: document.getElementById('f-serial').value.trim() || null,
    fecha_instalacion: fecha || null,
    anio: fecha ? fecha.slice(0,4) : null,
    caracteristicas_ops: document.getElementById('f-caract-ops').value.trim() || null,
    accesorios: document.getElementById('f-accesorios').value.trim() || null,
    observaciones: document.getElementById('f-observaciones').value.trim() || null,
    reporte_link: document.getElementById('f-reporte-link').value.trim() || null,
    serial_ops: null, activo_fijo_ups: null,
    custom:true,
  };
  const saveBtn = e.target.querySelector('button[type=submit]');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando...';
  const ok = await saveNewEntry(newEntry);
  saveBtn.disabled = false;
  saveBtn.textContent = 'Guardar pantalla';
  if(ok){
    ALL = await loadAllData();
    populateSelects();
    updateKPIs();
    renderTable();
    buildStatCharts();
    closeAllPanels();
    e.target.reset();
    showToast(SHEETS_MODE ? 'Pantalla guardada en Google Sheets' : 'Pantalla añadida al inventario');
  }
});

let charts = {};
function destroyCharts(){ Object.values(charts).forEach(c=>c && c.destroy()); charts={}; }

function buildStatCharts(){
  destroyCharts();

  // Por bloque: total real de pantallas por bloque (sin distincion de estado)
  const bloques = uniq(ALL.map(d=>d.bloque));
  const countByBlock = bloques.map(b=>ALL.filter(d=>d.bloque===b).length);

  charts.block = new Chart(document.getElementById('chartBlock'), {
    type:'bar',
    data:{ labels: bloques.map(b=>b.trim()), datasets:[
      {label:'Pantallas', data:countByBlock, backgroundColor:'#1B2A5B', borderRadius:5, maxBarThickness:20},
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      scales:{ x:{ticks:{font:{size:9}}, grid:{display:false}}, y:{beginAtZero:true, ticks:{precision:0,font:{size:10}}, grid:{color:'#E4E7EF'}} },
      plugins:{ legend:{display:false} },
      onClick:(evt, els)=>{ if(els.length){ const b=bloques[els[0].index]; state.bloque=b; document.getElementById('filterBloque').value=b; renderTable(); } }
    }
  });

  // Por modelo: cuenta TODAS las pantallas de cada modelo
  const modelos = uniq(ALL.map(d=>d.modelo));
  const modelCounts = modelos.map(m=>ALL.filter(d=>d.modelo===m).length);
  charts.modelo = new Chart(document.getElementById('chartModelo'), {
    type:'doughnut',
    data:{ labels: modelos, datasets:[{ data: modelCounts, backgroundColor: COLORS, borderWidth:2, borderColor:'#fff' }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
      plugins:{ legend:{position:'bottom', labels:{boxWidth:8,font:{size:9}, padding:8}} },
      onClick:(evt, els)=>{ if(els.length){ const m=modelos[els[0].index]; state.modelo=m; document.getElementById('filterModelo').value=m; renderTable(); } }
    }
  });

  // Por pulgadas: cuenta TODAS las pantallas de cada tamano
  const pulg = uniq(ALL.map(d=>d.pulgadas));
  const pulgCounts = pulg.map(p=>ALL.filter(d=>d.pulgadas===p).length);
  charts.pulgadas = new Chart(document.getElementById('chartPulgadas'), {
    type:'bar',
    data:{ labels: pulg, datasets:[{ data: pulgCounts, backgroundColor:['#1B2A5B','#F2B705','#3B4E8F','#C98A02'], borderRadius:6, maxBarThickness:34 }] },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
      scales:{ x:{beginAtZero:true, ticks:{precision:0,font:{size:10}}, grid:{color:'#E4E7EF'}}, y:{grid:{display:false}, ticks:{font:{size:11}}} },
      plugins:{ legend:{display:false} },
      onClick:(evt, els)=>{ if(els.length){ const p=pulg[els[0].index]; state.pulgadas=p; document.getElementById('filterPulgadas').value=p; renderTable(); } }
    }
  });

  // Por año: cuenta TODAS las pantallas segun el año de su fecha de instalacion registrada
  const anios = uniq(ALL.map(d=>d.anio)).sort();
  const anioCounts = anios.map(a=>ALL.filter(d=>d.anio===a).length);
  charts.anio = new Chart(document.getElementById('chartAnio'), {
    type:'bar',
    data:{ labels: anios, datasets:[{ data: anioCounts, backgroundColor:'#1B2A5B', borderRadius:6, maxBarThickness:34 }] },
    options:{ responsive:true, maintainAspectRatio:false,
      scales:{ x:{grid:{display:false}, ticks:{font:{size:11}}}, y:{beginAtZero:true, ticks:{precision:0,font:{size:10}}, grid:{color:'#E4E7EF'}} },
      plugins:{ legend:{display:false} },
      onClick:(evt, els)=>{ if(els.length){ const a=anios[els[0].index]; state.anio=a; document.getElementById('filterAnio').value=a; renderTable(); } }
    }
  });

  // Verificacion interna: la suma de cada grafica debe coincidir con el total de registros
  console.assert(countByBlock.reduce((a,b)=>a+b,0)===ALL.length, 'Por bloque no cuadra con el total');
  console.assert(modelCounts.reduce((a,b)=>a+b,0)===ALL.filter(d=>d.modelo).length, 'Por modelo no cuadra');
  console.assert(pulgCounts.reduce((a,b)=>a+b,0)===ALL.filter(d=>d.pulgadas).length, 'Por pulgadas no cuadra');
  console.assert(anioCounts.reduce((a,b)=>a+b,0)===ALL.filter(d=>d.anio).length, 'Por año no cuadra');
}

function renderReportes(){
  const wrap = document.getElementById('reportesList');
  const conReporte = ALL.filter(d => (d.observaciones && d.observaciones.trim()) || (d.reporte_link && d.reporte_link.trim()));

  if(conReporte.length === 0){
    wrap.innerHTML = `<div class="empty-state" style="padding:30px 20px">
      <div class="big">🗂️</div>
      Aún no hay observaciones ni carpetas de Drive cargadas.<br>
      Agrégalas desde "+ Añadir pantalla" o editando las columnas <b>observaciones</b> / <b>reporte_link</b> directamente en tu Google Sheet.
    </div>`;
    return;
  }

  wrap.innerHTML = conReporte.map(d => `
    <div class="report-row">
      <div class="report-main">
        <div class="report-title">${d.salon||'—'} <span class="report-bloque">${d.bloque ? d.bloque.trim() : ''}</span></div>
        <div class="report-obs">${d.observaciones ? d.observaciones : 'Sin observaciones registradas.'}</div>
      </div>
      ${d.reporte_link ? `<a class="btn small primary report-link" href="${d.reporte_link}" target="_blank" rel="noopener">📁 Ver en Drive ↗</a>` : ''}
    </div>
  `).join('');
}

function rebuildAll(){
  populateSelects();
  updateKPIs();
  renderTable();
  buildStatCharts();
  renderReportes();
}

(async function init(){
  if(SHEETS_MODE){
    document.querySelector('.sub').textContent += ' · Conectado a Google Sheets';
  }
  try{
    ALL = await loadAllData();
    if(ALL.length === 0){
      document.getElementById('empty').style.display = 'block';
      document.getElementById('empty').innerHTML =
        '<div class="big">⚠️</div>No se encontraron datos. Revisa data/pantallas.json o la configuración de Google Sheets en js/config.js.';
    }
  }catch(e){
    console.error(e);
    ALL = [];
  }
  rebuildAll();

  // Resalta en la navbar la sección visible mientras se hace scroll
  const navLinks = document.querySelectorAll('.quicknav a');
  const sections = [...navLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if(sections.length && 'IntersectionObserver' in window){
    const spy = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const id = '#' + entry.target.id;
          navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(sec => spy.observe(sec));
  }
})();
