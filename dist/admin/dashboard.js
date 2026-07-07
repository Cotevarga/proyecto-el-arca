(function() {
  'use strict';
  var A = window.__admin;

  A.contarPendientes = async function() {
    var s = await A.waitForSupabase();
    if (!s) return 0;
    var { count, error } = await s.from('recuerdos').select('*', { count: 'exact', head: true }).eq('aprobado', false);
    if (error) { console.error('[contarPendientes]', error); return 0; }
    return count ?? 0;
  };

  A.contarAprobados = async function() {
    var s = await A.waitForSupabase();
    if (!s) return 0;
    var { count, error } = await s.from('recuerdos').select('*', { count: 'exact', head: true }).eq('aprobado', true);
    if (error) { console.error('[contarAprobados]', error); return 0; }
    return count ?? 0;
  };

  A.contarCancionesActivas = async function() {
    var s = await A.waitForSupabase();
    if (!s) return 0;
    var { count, error } = await s.from('musica_reproductor').select('*', { count: 'exact', head: true }).eq('activo', true);
    if (error) { console.error('[contarCancionesActivas]', error); return 0; }
    return count ?? 0;
  };

  A.refrescarContadores = async function() {
    var [pend, aprob, music] = await Promise.all([A.contarPendientes(), A.contarAprobados(), A.contarCancionesActivas()]);
    if (A.dom.statPend) A.dom.statPend.textContent = pend;
    if (A.dom.statAprob) A.dom.statAprob.textContent = aprob;
    if (A.dom.statMusic) A.dom.statMusic.textContent = music;
  };

  A.cargarAhoraSuena = async function() {
    try {
      var s = await A.waitForSupabase();
      if (!s) return;
      var { data, error } = await s.from('musica_reproductor').select('*').eq('activo', true).order('orden', { ascending: true }).limit(1);
      if (error) throw error;
      if (!A.dom.npTitle || !A.dom.npArtist) return;
      if (data && data.length > 0) {
        A.dom.npTitle.textContent = data[0].titulo || '—';
        A.dom.npArtist.textContent = data[0].artista || 'El Arca';
      } else {
        A.dom.npTitle.textContent = 'Radio en vivo';
        A.dom.npArtist.textContent = 'Esperando transmisión...';
      }
    } catch (err) { console.error('[AhoraSuena] Error:', err); }
  };

  var _uploadsChart = null;
  var _typeChart = null;

  A.cargarEstadisticasMemoria = async function() {
    try {
      var s = await A.waitForSupabase();
      if (!s) return;
      var [rTotal, rVecinos, rBytes, rTimeline] = await Promise.all([
        s.from('recuerdos').select('*', { count: 'exact', head: true }),
        s.from('recuerdos').select('nombre', { count: 'exact', head: true }).not('nombre', 'is', null).neq('nombre', ''),
        s.from('recuerdos').select('tamanio_bytes').not('tamanio_bytes', 'is', null),
        s.from('recuerdos').select('created_at, tipo_archivo').order('created_at', { ascending: true })
      ]);

      if (A.dom.statTotalRecuerdos) A.dom.statTotalRecuerdos.textContent = (rTotal.count ?? 0).toLocaleString('es-CL');

      if (A.dom.statVecinosUnicos) {
        try {
          var { data: nombresData, error: nombresErr } = await s.from('recuerdos').select('nombre').not('nombre', 'is', null).neq('nombre', '');
          if (!nombresErr && nombresData) {
            var unicos = {};
            nombresData.forEach(function(r) { if (r.nombre) unicos[r.nombre.toLowerCase().trim()] = true; });
            A.dom.statVecinosUnicos.textContent = Object.keys(unicos).length.toLocaleString('es-CL');
          }
        } catch (e) { A.dom.statVecinosUnicos.textContent = '—'; }
      }

      if (A.dom.statGbPreservados) {
        var totalBytes = 0;
        if (rBytes.data) rBytes.data.forEach(function(r) { totalBytes += Number(r.tamanio_bytes || 0); });
        A.dom.statGbPreservados.textContent = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
      }

      if (rTimeline.data && window.Chart) {
        var timelineData = rTimeline.data;
        var monthCount = {};
        timelineData.forEach(function(r) {
          if (!r.created_at) return;
          var m = r.created_at.substring(0, 7);
          monthCount[m] = (monthCount[m] || 0) + 1;
        });
        var months = Object.keys(monthCount).sort();
        var counts = months.map(function(m) { return monthCount[m]; });

        if (A.dom.uploadsChart) {
          if (_uploadsChart) { _uploadsChart.destroy(); _uploadsChart = null; }
          _uploadsChart = new Chart(A.dom.uploadsChart, {
            type: 'line',
            data: {
              labels: months.map(function(m) { var p = m.split('-'); return p[1] + '/' + p[0].slice(2); }),
              datasets: [{
                label: 'Subidas',
                data: counts,
                borderColor: '#E50914',
                backgroundColor: 'rgba(229,9,20,0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 2,
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: '#666', font: { size: 8 }, maxTicksLimit: 12 }, grid: { color: 'rgba(255,255,255,0.03)' } },
                y: { ticks: { color: '#666', font: { size: 8 }, stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.03)' }, beginAtZero: true }
              }
            }
          });
        }

        var typeCount = {};
        timelineData.forEach(function(r) {
          var t = r.tipo_archivo || 'texto';
          if (t.indexOf('image') === 0) t = 'Imagen';
          else if (t.indexOf('audio') === 0) t = 'Audio';
          else if (t.indexOf('video') === 0) t = 'Video';
          else if (t === 'application/pdf') t = 'PDF';
          else t = 'Texto';
          typeCount[t] = (typeCount[t] || 0) + 1;
        });
        var typeLabels = Object.keys(typeCount);
        var typeValues = typeLabels.map(function(l) { return typeCount[l]; });
        var typeColors = ['#E50914','#2196F3','#4CAF50','#FF9800','#9C27B0','#00BCD4'];

        if (A.dom.typeChart) {
          if (_typeChart) { _typeChart.destroy(); _typeChart = null; }
          _typeChart = new Chart(A.dom.typeChart, {
            type: 'doughnut',
            data: {
              labels: typeLabels,
              datasets: [{
                data: typeValues,
                backgroundColor: typeColors.slice(0, typeLabels.length),
                borderColor: 'transparent',
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'right', labels: { color: '#888', font: { size: 9 }, boxWidth: 10, padding: 8 } }
              },
              cutout: '55%',
            }
          });
        }
      }
    } catch (err) { console.error('[Estadisticas] Error:', err); }
  };

  A.renderRecentRecuerdos = async function() {
    try {
      var s = await A.waitForSupabase();
      if (!s) return;
      var { data, error } = await s.from('recuerdos').select('*').order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      var recuerdos = data || [];
      var recentList = A.dom.recentRecuerdosList;
      if (!recentList) return;

      if (recuerdos.length === 0) {
        recentList.innerHTML = '<div class="empty-state"><div class="icon">📭</div><div class="text">No hay recuerdos aún</div></div>';
        return;
      }

      var html = '<table><thead><tr><th>Fecha</th><th>Pseudónimo</th><th>Sección</th><th>Estado</th><th class="hide-mobile">Acción</th></tr></thead><tbody>';
      recuerdos.forEach(function(r) {
        var fecha = r.created_at ? new Date(r.created_at).toLocaleDateString('es-CL') : '—';
        var nombre = A.escapeHtml(r.nombre || 'Anónimo');
        var seccionLabel = A.nombreSeccion(r.seccion);
        var editAccion = '<button class="btn-sm btn-sm-edit" onclick="window.editRecuerdo(\'' + r.id + '\')" aria-label="Editar recuerdo" style="margin-right:4px;">✎ Editar</button>';
        var estadoBadge, acciones;
        if (r.aprobado) {
          estadoBadge = '<span class="badge badge-approved">Publicado</span>';
          acciones = editAccion + '<button class="btn-sm btn-sm-danger" onclick="window.rejectRecuerdo(\'' + r.id + '\')" aria-label="Eliminar recuerdo">✕ Eliminar</button>';
        } else {
          estadoBadge = '<span class="badge badge-pending">Pendiente</span>';
          acciones = '<button class="btn-sm btn-sm-approve" onclick="window.approveRecuerdo(\'' + r.id + '\')" style="margin-right:4px;" aria-label="Abrir aprobación">✓ Aprobar</button>' +
            editAccion +
            '<button class="btn-sm btn-sm-reject" onclick="window.rejectRecuerdo(\'' + r.id + '\')" aria-label="Eliminar pendiente">✕ Eliminar</button>';
        }
        html += '<tr><td style="white-space:nowrap;">' + fecha + '</td><td class="truncate">' + nombre + '</td><td>' + seccionLabel + '</td><td>' + estadoBadge + '</td><td class="hide-mobile" style="white-space:nowrap;">' + acciones + '</td></tr>';
      });
      html += '</tbody></table>';
      recentList.innerHTML = html;
    } catch (err) { console.error('[renderRecentRecuerdos] Error:', err); }
  };

  A.cargarStatsPorPais = async function() {
    try {
      var s = await A.waitForSupabase();
      if (!s) return;
      var { data, error } = await s.from('recuerdos').select('pais');
      if (error) throw error;
      var conteo = {};
      (data || []).forEach(function(r) {
        var p = (r.pais || 'Sin país').trim();
        if (!p) p = 'Sin país';
        conteo[p] = (conteo[p] || 0) + 1;
      });
      var sorted = Object.keys(conteo).sort(function(a, b) { return conteo[b] - conteo[a]; });
      var total = sorted.reduce(function(s, k) { return s + conteo[k]; }, 0);
      var maxVal = sorted.length > 0 ? conteo[sorted[0]] : 1;
      var container = A.dom.countryStatsContainer;
      if (!container) return;
      if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:20px 0;"><div class="icon">🌍</div><div class="text">Sin datos de ubicación</div></div>';
        return;
      }
      var html = '';
      sorted.forEach(function(pais) {
        var pct = (conteo[pais] / total * 100).toFixed(1);
        var barW = (conteo[pais] / maxVal * 100).toFixed(0);
        html += '<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:11px;color:#ccc;margin-bottom:2px;"><span>' + A.escapeHtml(pais) + '</span><span>' + conteo[pais] + ' (' + pct + '%)</span></div><div style="height:6px;background:rgba(229,9,20,0.08);border-radius:3px;overflow:hidden;"><div style="height:100%;width:' + barW + '%;background:var(--color-mir);border-radius:3px;transition:width 0.6s ease;"></div></div></div>';
      });
      container.innerHTML = html;
    } catch (err) {
      console.error('[StatsPais] Error:', err);
      var container = A.dom.countryStatsContainer;
      if (container && (err.code === '42703' || (err.message && err.message.indexOf('42703') !== -1))) {
        container.innerHTML = '<div class="empty-state" style="padding:20px 0;"><div class="icon">🗄️</div><div class="text" style="font-size:12px;color:#999;">La columna <code style="background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:3px;">pais</code> no existe. Ejecuta en el SQL Editor:<br><code style="background:rgba(255,255,255,0.06);padding:4px 10px;border-radius:4px;display:inline-block;margin-top:8px;font-size:11px;">ALTER TABLE public.recuerdos ADD COLUMN IF NOT EXISTS pais VARCHAR(100) DEFAULT \'Chile\';<br>NOTIFY pgrst, \'reload schema\';</code></div></div>';
      }
    }
  };

  A.cargarStatsPorSeccion = async function() {
    try {
      var s = await A.waitForSupabase();
      if (!s) return;
      var { data, error } = await s.from('recuerdos').select('seccion');
      if (error) throw error;
      var conteo = {};
      (data || []).forEach(function(r) { var sec = r.seccion || 'general'; conteo[sec] = (conteo[sec] || 0) + 1; });
      var sorted = Object.keys(conteo).sort(function(a, b) { return conteo[b] - conteo[a]; });
      var total = sorted.reduce(function(s, k) { return s + conteo[k]; }, 0);
      var container = A.dom.sectionStatsContainer;
      if (!container) return;
      if (sorted.length === 0) { container.innerHTML = '<div class="empty-state" style="padding:20px 0;"><div class="icon">📁</div><div class="text">Sin datos</div></div>'; return; }
      var COLORS = ['#E50914','#2196F3','#4CAF50','#FF9800','#9C27B0','#00BCD4','#FF5722','#607D8B'];
      var html = '';
      sorted.forEach(function(sec, i) {
        var pct = (conteo[sec] / total * 100).toFixed(1);
        html += '<div style="margin-bottom:6px;"><div style="display:flex;justify-content:space-between;font-size:11px;color:#ccc;margin-bottom:2px;"><span>' + A.escapeHtml(A.nombreSeccion(sec)) + '</span><span>' + conteo[sec] + ' (' + pct + '%)</span></div></div>';
      });
      container.innerHTML = html;
    } catch (err) { console.error('[StatsSeccion] Error:', err); }
  };

  A.loadDashboard = async function() {
    var s = await A.waitForSupabase();
    if (!s) { A.showToast('Error de conexión con la base de datos', 'error'); return; }
    await Promise.all([
      A.refrescarContadores(), A.cargarAhoraSuena(), A.renderRecentRecuerdos(),
      A.cargarEstadisticasMemoria(), A.cargarStatsPorPais(), A.cargarStatsPorSeccion(),
      A.loadSecurityEvents()
    ]);
  };
})();
