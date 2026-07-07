(function() {
  'use strict';
  var A = window.__admin = window.__admin || {};
  A.s = A.s || {};

  A.s.supabaseAnonKey = window.SUPABASE_ANON_KEY || '';
  A.s.API_BASE = window.API_BASE || window.location.origin;
  A.s.token = localStorage.getItem('admin_token');
  A.s.userData = null;

  A.dom = {};
  function q(id) { A.dom[id] = A.dom[id] || document.getElementById(id); return A.dom[id]; }

  A.s.ready = function() {
    A.dom.loginScreen = q('login-screen');
    A.dom.dashboardScreen = q('dashboard-screen');
    A.dom.loginForm = q('login-form');
    A.dom.loginError = q('login-error');
    A.dom.btnLogin = q('btn-login');
    A.dom.btnLogout = q('btn-logout');
    A.dom.userNameDisplay = q('user-name-display');
    A.dom.userAvatar = q('user-avatar');
    A.dom.sectionTitle = q('section-title');
    A.dom.toastContainer = q('toast-container');
    A.dom.realtimeBadge = q('realtime-badge');
    A.dom.securityAlertBadge = q('security-alert-badge');
    A.dom.sectionStatsContainer = q('section-stats-container');
    A.dom.countryStatsContainer = q('country-stats-container');
    A.dom.pendingList = q('pending-list');
    A.dom.pendingCount = q('pending-count');
    A.dom.approvedList = q('approved-list');
    A.dom.historyList = q('history-list');
    A.dom.historyCount = q('history-count');
    A.dom.recentRecuerdosList = q('recent-recuerdos-list');
    A.dom.statPend = q('stat-pending');
    A.dom.statAprob = q('stat-approved');
    A.dom.statMusic = q('stat-music');
    A.dom.uploadsChart = q('uploads-chart');
    A.dom.typeChart = q('type-chart');
    A.dom.npTitle = q('np-title');
    A.dom.npArtist = q('np-artist');
    A.dom.securityEventsList = q('security-events-list');
    A.dom.securityCountBadge = q('security-count-badge');
    A.dom.secOkCount = q('sec-ok-count');
    A.dom.secFailCount = q('sec-fail-count');
    A.dom.secRejectedCount = q('sec-rejected-count');
    A.dom.secBanner = q('security-banner');
    A.dom.secBannerText = q('security-banner-text');
    A.dom.contenedorCanciones = q('contenedor-canciones');
    A.dom.musicUploadArea = q('music-upload-area');
    A.dom.musicFileInput = q('music-file');
    A.dom.musicFileInfo = q('music-file-info');
    A.dom.musicUploadText = q('music-upload-text');
    A.dom.musicUploadForm = q('music-upload-form');
    A.dom.btnUploadMusic = q('btn-upload-music');
    A.dom.adminUploadForm = q('admin-upload-form');
    A.dom.adminUploadSeccion = q('admin-upload-seccion');
    A.dom.dynamicContainer = q('dynamic-fields-container');
    A.dom.adminUploadTitulo = q('admin-upload-titulo');
    A.dom.adminUploadDestacado = q('admin-upload-destacado');
    A.dom.adminUploadGeo = q('admin-upload-geo');
    A.dom.adminUploadFecha = q('admin-upload-fecha');
    A.dom.adminUploadTags = q('admin-upload-tags');
    A.dom.adminUploadTranscripcion = q('admin-upload-transcripcion');
    A.dom.approvalTranscripcion = q('approval-transcripcion');
    A.dom.editTranscripcion = q('edit-transcripcion');
    A.dom.btnAdminUpload = q('btn-admin-upload');
    A.dom.userBadge = q('user-badge');
    A.dom.userDropdown = q('user-dropdown');
    A.dom.pwModal = q('password-modal');
    A.dom.pwCurrent = q('pw-current');
    A.dom.pwNew = q('pw-new');
    A.dom.pwConfirm = q('pw-confirm');
    A.dom.pwError = q('pw-error');
    A.dom.btnPwCancel = q('btn-pw-cancel');
    A.dom.btnPwSave = q('btn-pw-save');
    A.dom.reviewModal = q('review-modal');
    A.dom.reviewImg = q('review-img');
    A.dom.reviewText = q('review-text');
    A.dom.btnReviewClose = q('btn-review-close');
    A.dom.editModal = q('edit-modal');
    A.dom.editSeccion = q('edit-seccion');
    A.dom.editNombre = q('edit-nombre');
    A.dom.editTitulo = q('edit-titulo');
    A.dom.editSerie = q('edit-serie');
    A.dom.editTexto = q('edit-texto');
    A.dom.editGeo = q('edit-geo');
    A.dom.editTags = q('edit-tags');
    A.dom.btnEditCancel = q('btn-edit-cancel');
    A.dom.btnEditSave = q('btn-edit-save');
    A.dom.approvalModal = q('approval-modal');
    A.dom.approvalSeccion = q('approval-seccion');
    A.dom.approvalTextoLargo = q('approval-textolargo');
    A.dom.approvalTextoLargoStd = q('approval-textolargo-std');
    A.dom.approvalTitulo = q('approval-titulo');
    A.dom.approvalSerie = q('approval-serie');
    A.dom.approvalRelatoFields = q('approval-relato-fields');
    A.dom.approvalStdFields = q('approval-standard-fields');
    A.dom.approvalDestacado = q('approval-destacado');
    A.dom.btnApprovalCancel = q('btn-approval-cancel');
    A.dom.btnApprovalConfirm = q('btn-approval-confirm');
    A.dom.rejectionModal = q('rejection-modal');
    A.dom.rejectionRazon = q('rejection-razon');
    A.dom.rejectionDetalle = q('rejection-detalle');
    A.dom.btnRejectionCancel = q('btn-rejection-cancel');
    A.dom.btnRejectionConfirm = q('btn-rejection-confirm');
    A.dom.statTotalRecuerdos = q('stat-total-recuerdos');
    A.dom.statVecinosUnicos = q('stat-vecinos-unicos');
    A.dom.statGbPreservados = q('stat-gb-preservados');
    A.dom.historySearch = q('history-search');
    A.dom.historyFilterSection = q('history-filter-section');
    A.dom.historyFilterStatus = q('history-filter-status');
  };

  A.NOMBRES_SECCION = {
    'Galeria': 'Galería',
    'Videos y Audios': 'Videos y Audios',
    'Relatos: El Jano': 'Relatos: El Jano',
    'Relatos: El Arca': 'Relatos: El Arca',
    'Relatos: Otras organizaciones': 'Relatos: Otras organizaciones',
    'Relatos: Anecdotas': 'Relatos: Anecdotas',
    'musica': 'Música'
  };

  A.nombreSeccion = function(raw) {
    return A.NOMBRES_SECCION[raw] || (raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'General');
  };

  A.SECCIONES_VALIDAS = [
    'Galeria', 'Videos y Audios', 'Musica',
    'Relatos: El Jano', 'Relatos: El Arca', 'Relatos: Otras organizaciones',
    'Relatos: Anecdotas'
  ];

  A.SECCIONES_CONFIG = {
    'Galeria': { label: 'Galería', fields: ['imagen'], requireFile: true, requireTexto: false },
    'Videos y Audios': { label: 'Videos y Audios', fields: ['multimedia'], requireFile: true, requireTexto: false },
    'Relatos: El Jano': { label: 'Relatos: El Jano', fields: ['archivo_opcional', 'texto_largo'], requireFile: false, requireTexto: true },
    'Relatos: El Arca': { label: 'Relatos: El Arca', fields: ['archivo_opcional', 'texto_largo'], requireFile: false, requireTexto: true },
    'Relatos: Otras organizaciones': { label: 'Relatos: Otras organizaciones', fields: ['archivo_opcional', 'texto_largo'], requireFile: false, requireTexto: true },
    'Relatos: Anecdotas': { label: 'Relatos: Anecdotas', fields: ['archivo_opcional', 'texto_largo'], requireFile: false, requireTexto: true },
    'Musica': { label: 'Música', fields: ['multimedia'], requireFile: false, requireTexto: false }
  };

  A.validarSeccion = function(seccion) {
    if (!seccion || A.SECCIONES_VALIDAS.indexOf(seccion) === -1) {
      alert('Error: Categoría no válida. Selecciona una sección correcta.');
      return false;
    }
    return true;
  };

  A.sb = function() { return window._supabase; };
  A.getSupabaseClient = function() { return window.miSupabase || window._supabase; };

  A.waitForSupabase = async function(maxWaitMs) {
    maxWaitMs = maxWaitMs || 10000;
    var start = Date.now();
    while (!A.getSupabaseClient() && (Date.now() - start) < maxWaitMs) {
      await new Promise(function(r) { setTimeout(r, 200); });
    }
    return A.getSupabaseClient();
  };

  A.adminFetch = async function(path, options) {
    var url = (window.fnUrl ? window.fnUrl(path.split('/')[0]) : null)
      || (A.s.API_BASE + '/api/v1/admin/' + path);
    var opts = options || {};
    opts.headers = opts.headers || {};
    opts.headers['Authorization'] = 'Bearer ' + A.s.token;
    if (!opts.method) opts.method = 'GET';
    if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    var res = await fetch(url, opts);
    if (res.status === 401 || res.status === 403) { A.handleUnauthorized(); throw new Error('Sesión expirada'); }
    return res.json();
  };

  A.handleUnauthorized = function() {
    if (A.detenerRealtime) A.detenerRealtime();
    A.s.token = null;
    A.s.userData = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    if (A.dom.loginScreen) A.dom.loginScreen.style.display = 'flex';
    if (A.dom.dashboardScreen) A.dom.dashboardScreen.style.display = 'none';
    A.showToast('Sesión expirada. Ingresa nuevamente.', 'error');
  };

  A.registrarAuditoria = async function(accion, entidad, entidadId, metadata) {
    try {
      var fnUrl = window.EDGE_FUNCTIONS_URL;
      if (!fnUrl || !A.s.token) return;
      await fetch(fnUrl + '/auditoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + A.s.token },
        body: JSON.stringify({
          accion: accion,
          entidad: entidad,
          entidad_id: entidadId || null,
          usuario_id: (A.s.userData && A.s.userData.id) || null,
          usuario_email: (A.s.userData && A.s.userData.email) || null,
          metadata: metadata || null
        })
      });
    } catch (err) {
      console.warn('[Auditoría] Error al registrar:', err.message);
    }
  };

  A.escapeHtml = function(text) {
    if (!text) return '';
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, function(c) { return map[c]; });
  };

  A.mostrarToastExito = function(msg) { A.showToast(msg, 'success'); };
  A.mostrarToastError = function(msg) { A.showToast('Error al subir: ' + msg, 'error'); };

  A.procesarSubida = async function(btn, fn) {
    if (!btn) return;
    var textoOriginal = btn.textContent;
    btn.textContent = 'Publicando...';
    btn.disabled = true;
    try {
      await fn();
      A.mostrarToastExito('Subido correctamente');
    } catch (err) {
      console.error('[procesarSubida] Error completo:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      console.error('[procesarSubida] Mensaje:', err.message);
      console.error('[procesarSubida] Detalle:', err.details || '(sin detalle)');
      console.error('[procesarSubida] Código:', err.code || '(sin código)');
      console.error('[procesarSubida] Sugerencia:', err.hint || '(sin sugerencia)');
      A.mostrarToastError(err.message || 'Error desconocido');
    } finally {
      btn.textContent = textoOriginal;
      btn.disabled = false;
    }
  };

  A.subirArchivo = async function(file, seccion, extraData) {
    var s = await A.waitForSupabase();
    if (!s) throw new Error('Cliente Supabase no disponible');
    var bucket = 'elarca-uploads';
    if (!A.validarSeccion(seccion)) throw new Error('Sección inválida');

    var now = new Date().toISOString();
    var linkUrl = extraData.url_externo || null;
    var tipoArchivo = null;
    if (linkUrl) {
      var l = linkUrl.toLowerCase();
      if (l.indexOf('youtube.com') !== -1 || l.indexOf('youtu.be') !== -1) tipoArchivo = 'video/youtube';
      else if (l.indexOf('facebook.com') !== -1) tipoArchivo = 'video/facebook';
      else if (l.match(/\.(mp3|wav|ogg|aac|m4a|flac)(\?|$)/)) tipoArchivo = 'audio/external';
      else if (l.match(/\.(mp4|webm|ogg|mov|avi)(\?|$)/)) tipoArchivo = 'video/external';
      else tipoArchivo = 'link';
    }

    var insertData = {
      nombre: extraData.nombre || 'Admin',
      mensaje: extraData.descripcion || null,
      mensaje_largo: extraData.texto_largo || null,
      titulo_relato: extraData.titulo_relato || null,
      nombre_serie: extraData.nombre_serie || null,
      url_archivo: linkUrl || null,
      tipo_archivo: tipoArchivo,
      seccion: seccion,
      aprobado: true,
      destacado: extraData.destacado === true,
      es_efimero: extraData.es_efimero === true,
      fecha_subida: now,
      geolocalizacion: extraData.geolocalizacion || null,
      tags: extraData.tags || null,
      fecha_creacion_archivo: extraData.fecha_creacion_archivo || null,
      transcripcion: extraData.transcripcion || null
    };

    var { data: inserted, error: insertError } = await s.from('recuerdos').insert(insertData).select().single();
    if (insertError) throw new Error(insertError.message + (insertError.details ? ' — ' + insertError.details : ''));

    var recordId = inserted.id;

    var mimeFromExt = function(fname) {
      var e = fname.split('.').pop().toLowerCase();
      var map = { 'jpg':'image/jpeg', 'jpeg':'image/jpeg', 'png':'image/png', 'webp':'image/webp', 'gif':'image/gif', 'mp4':'video/mp4', 'mp3':'audio/mpeg', 'wav':'audio/wav', 'ogg':'audio/ogg', 'pdf':'application/pdf' };
      return map[e] || 'application/octet-stream';
    };
    var detectedMime = file.type || mimeFromExt(file.name);
    var sanitize = function(name) { return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.\./g, '.'); };
    var ext = file.name.lastIndexOf('.') !== -1 ? file.name.slice(file.name.lastIndexOf('.')) : '';
    var baseName = file.name.replace(/\.[^/.]+$/, '').substring(0, 40);
    var storagePath = 'recuerdos/' + recordId + '/' + sanitize(baseName) + ext;

    var { error: uploadError } = await s.storage.from(bucket).upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      await s.from('recuerdos').delete().eq('id', recordId);
      throw new Error('Error al subir archivo: ' + uploadError.message);
    }

    var { data: { publicUrl } } = s.storage.from(bucket).getPublicUrl(storagePath);

    var { error: updateError } = await s.from('recuerdos').update({
      url_archivo: publicUrl, storage_path: storagePath, tipo_archivo: detectedMime,
      nombre_original: file.name, tamanio_bytes: file.size
    }).eq('id', recordId);
    if (updateError) throw new Error('Error al vincular archivo: ' + updateError.message);

    inserted.url_archivo = publicUrl;
    inserted.storage_path = storagePath;
    inserted.tipo_archivo = detectedMime;
    inserted.nombre_original = file.name;
    inserted.tamanio_bytes = file.size;

    A.registrarAuditoria('admin_upload', 'recuerdo', recordId, {
      seccion: seccion, nombre: extraData.nombre, tipo_archivo: file.type, tamanio_bytes: file.size
    });
    A.showToast((extraData.nombre || 'Archivo') + ' subido exitosamente a ' + (A.NOMBRES_SECCION[seccion] || seccion), 'success');
    return inserted;
  };
})();
