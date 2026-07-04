window.SUPABASE_URL = window.SUPABASE_URL || '';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
window.EDGE_FUNCTIONS_URL = window.EDGE_FUNCTIONS_URL || '';

(function () {
  'use strict';

  window.inicializarSupabase = function () {
    if (typeof supabase === 'undefined') {
      console.warn('[Supabase] SDK no disponible');
      return false;
    }
    var url = window.SUPABASE_URL;
    var key = window.SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('[Supabase] URL o ANON_KEY no definidos');
      return false;
    }
    window._supabase = supabase.createClient(url, key, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    });
    console.log('[Supabase] Cliente inicializado');
    return true;
  };

  if (window.__supabaseLoaded) return;
  window.__supabaseLoaded = true;

  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/dist/umd/supabase.min.js';
  script.onload = function () {
    if (typeof supabase === 'undefined') {
      console.warn('[Supabase] SDK no cargó');
      return;
    }
    window.inicializarSupabase();
  };
  document.head.appendChild(script);

  window.fnUrl = function (name) {
    return window.EDGE_FUNCTIONS_URL + '/' + name;
  };

  window.authHeaders = function () {
    var t = localStorage.getItem('admin_token');
    return t ? { Authorization: 'Bearer ' + t } : {};
  };
})();
