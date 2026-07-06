/* ─────────────── Buscador interno ─────────────── */
(function () {
  'use strict';
  var fnUrl = window.EDGE_FUNCTIONS_URL;
  var searchEl = document.getElementById('buscador-input');
  var resultsEl = document.getElementById('buscador-results');
  var clearEl = document.getElementById('buscador-clear');
  if (!searchEl || !resultsEl) return;

  var timeout = null;

  function render(items) {
    if (!items || items.length === 0) {
      resultsEl.innerHTML = '<div class="text-white/40 text-sm py-4">Sin resultados</div>';
      return;
    }
    var html = '';
    items.forEach(function (d) {
      var icono = d.tipo_archivo ? (d.tipo_archivo.startsWith('audio') ? '🎵' : d.tipo_archivo.startsWith('video') ? '🎬' : d.tipo_archivo.startsWith('image') ? '📷' : '📄') : '📄';
      var origen = d.pais || '';
      if (d.region) origen += (origen ? ', ' : '') + d.region;
      html += '<a href="' + (d.url_archivo || '#') + '" target="_blank" class="block px-4 py-3 hover:bg-white/5 border-b border-white/5 transition text-sm" style="text-decoration:none;">' +
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

  function buscar(q) {
    if (q.length < 2) { resultsEl.innerHTML = ''; return; }
    fetch(fnUrl + '/search?q=' + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.success) render(res.data);
        else resultsEl.innerHTML = '<div class="text-white/40 text-sm py-4">' + (res.error || 'Error') + '</div>';
      })
      .catch(function () {
        resultsEl.innerHTML = '<div class="text-white/40 text-sm py-4">Error al buscar</div>';
      });
  }

  searchEl.addEventListener('input', function () {
    clearTimeout(timeout);
    var v = searchEl.value.trim();
    if (v.length === 0) { resultsEl.innerHTML = ''; if (clearEl) clearEl.classList.add('hidden'); return; }
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
