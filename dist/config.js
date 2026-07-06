(function () {
  'use strict';

  // ─── Único lugar donde se definen las credenciales de Supabase ───
  // Si rotas la anon key, cámbiala SOLO aquí.
  window.SUPABASE_URL = 'https://ukpoprkdgezgxlkjjuve.supabase.co';
  window.SUPABASE_ANON_KEY = 'sb_publishable_4fc-Vh3qJQkTTAbMWA4I8A_N7jUbEMi';
  window.EDGE_FUNCTIONS_URL = window.SUPABASE_URL + '/functions/v1';
  window.SUPABASE_PROJECT_ID = 'ukpoprkdgezgxlkjjuve';

  window.__supabaseReady = true;
})();
