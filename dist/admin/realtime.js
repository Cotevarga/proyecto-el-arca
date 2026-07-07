(function() {
  'use strict';
  var A = window.__admin;
  A.s._realtimeChannel = null;
  A.s._musicaChannel = null;

  A.iniciarRealtime = function() {
    var s = window.__admin.getSupabaseClient();
    if (!s) { console.warn('[Realtime] Cliente no disponible'); return; }
    if (A.s._realtimeChannel) { try { s.removeChannel(A.s._realtimeChannel); } catch(e) {} }
    A.s._realtimeChannel = s.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recuerdos' }, function(payload) {
        console.log('[Realtime] Cambio en recuerdos:', payload.eventType);
        A.refrescarContadores();
        A.renderRecentRecuerdos();
      })
      .subscribe(function(status) {
        console.log('[Realtime] Estado:', status);
        if (A.dom.realtimeBadge) A.dom.realtimeBadge.style.background = status === 'SUBSCRIBED' ? '#4caf50' : '#f44336';
      });
  };

  A.detenerRealtime = function() {
    var s = window.__admin.getSupabaseClient();
    if (s && A.s._realtimeChannel) { s.removeChannel(A.s._realtimeChannel); A.s._realtimeChannel = null; }
    if (s && A.s._musicaChannel) { s.removeChannel(A.s._musicaChannel); A.s._musicaChannel = null; }
  };

  A.iniciarRealtimeMusica = function() {
    var s = window.__admin.getSupabaseClient();
    if (!s) return;
    if (A.s._musicaChannel) { try { s.removeChannel(A.s._musicaChannel); } catch(e) {} }
    A.s._musicaChannel = s.channel('musica-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'musica_reproductor' }, function(payload) {
        console.log('[Realtime] Cambio en musica_reproductor:', payload.eventType);
        A.actualizarListadoMusica();
        A.refrescarContadores();
        A.cargarAhoraSuena();
      })
      .subscribe(function(status) { console.log('[Realtime] Estado musica-channel:', status); });
  };
})();
