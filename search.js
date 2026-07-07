/* ─────────────── Buscador interno ─────────────── */
(function () {
  'use strict';

  var fnUrl = window.EDGE_FUNCTIONS_URL;
  var searchEl = document.getElementById('buscador-input');
  var resultsEl = document.getElementById('buscador-results');
  var clearEl = document.getElementById('buscador-clear');
  if (!searchEl || !resultsEl) return;

  var timeout = null;

  function getTargetUrl(d) {
    var id = d && d.id;
    if (!id) return '#';
    return '/archivo.html?view=rec-' + id;
  }

  function render(items) {
    resultsEl.style.display = 'block';
    if (!items || items.length === 0) {
      resultsEl.innerHTML = '<div class="text-white/40 text-sm py-4">Sin resultados</div>';
      return;
    }
    var html = '';
    items.forEach(function (d) {
      var icono = d.tipo_archivo ? (d.tipo_archivo.startsWith('audio') ? '🎵' : d.tipo_archivo.startsWith('video') ? '🎬' : d.tipo_archivo.startsWith('image') ? '📷' : '📄') : '📄';
      var origen = (d.geolocalizacion || '').trim();
      var targetUrl = getTargetUrl(d);
      html += '<a href="' + targetUrl + '" class="block px-4 py-3 hover:bg-white/5 border-b border-white/5 transition text-sm" style="text-decoration:none;">' +
        '<span class="flex items-center gap-2">' +
          '<span>' + icono + '</span>' +
          '<span class="text-white font-medium">' + (d.nombre || 'Anónimo') + '</span>' +
          (origen ? '<span class="text-white/40 text-xs ml-auto">' + origen + '</span>' : '') +
        '</span>' +
        (d.mensaje_largo ? '<span class="text-white/50 text-xs line-clamp-1 mt-1">' + d.mensaje_largo.substring(0, 150) + '</span>' : '') +
      '</a>';
    });
    resultsEl.innerHTML = html;
  }

  function buscarDirecto(q) {
    if (!window._supabase && !window.miSupabase) {
      resultsEl.innerHTML = '<div class="text-white/40 text-sm py-4">Cliente no disponible</div>';
      return;
    }
    var client = window.miSupabase || window._supabase;
    var term = q.replace(/[^\w\sáéíóúñüäëïö]/gi, '').trim();
    if (!term) { buscarViaEdge(q); return; }
    client
      .from('recuerdos')
      .select('id, nombre, mensaje_largo, tipo_archivo, url_archivo, geolocalizacion, created_at')
      .eq('aprobado', true)
      .or('nombre.ilike.%' + term + '%,mensaje_largo.ilike.%' + term + '%')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(function (res) {
        if (res.error) throw res.error;
        render(res.data);
      })
      .catch(function () {
        resultsEl.innerHTML = '<div class="text-white/40 text-sm py-4">Error al buscar</div>';
      });
  }

  function buscarViaEdge(q) {
    fetch(fnUrl + '/search?q=' + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.success) render(res.data);
        else buscarDirecto(q);
      })
      .catch(function () { buscarDirecto(q); });
  }

  function buscar(q) {
    if (q.length < 2) { resultsEl.innerHTML = ''; return; }
    buscarViaEdge(q);
  }

  searchEl.addEventListener('input', function () {
    clearTimeout(timeout);
    var v = searchEl.value.trim();
    if (v.length === 0) { resultsEl.innerHTML = ''; resultsEl.style.display = 'none'; if (clearEl) clearEl.classList.add('hidden'); return; }
    if (clearEl) clearEl.classList.remove('hidden');
    timeout = setTimeout(function () { buscar(v); }, 300);
  });

  if (clearEl) {
    clearEl.addEventListener('click', function () {
      searchEl.value = '';
      resultsEl.innerHTML = '';
      clearEl.classList.add('hidden');
      searchEl.focus();
    });
  }
})();
