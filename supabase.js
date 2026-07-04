window.SUPABASE_URL = window.SUPABASE_URL || '';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
window.EDGE_FUNCTIONS_URL = window.EDGE_FUNCTIONS_URL || '';

(function () {
  'use strict';

  if (window.__supabaseLoaded) return;
  window.__supabaseLoaded = true;

  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/dist/umd/supabase.min.js';
  script.onload = function () {
    if (typeof supabase === 'undefined') {
      console.warn('Supabase SDK no cargó correctamente');
      return;
    }

    var url = window.SUPABASE_URL;
    var key = window.SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn('SUPABASE_URL y SUPABASE_ANON_KEY deben estar definidos');
      return;
    }

    window._supabase = supabase.createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  };
  document.head.appendChild(script);

  // ─── Helper: Edge Function URL builder ───
  window.fnUrl = function (name) {
    var base = window.EDGE_FUNCTIONS_URL;
    return base + '/' + name;
  };

  // ─── Helper: auth header for admin calls ───
  window.authHeaders = function () {
    var token = localStorage.getItem('admin_token');
    if (!token) return {};
    return { Authorization: 'Bearer ' + token };
  };
})();
