(function() {
  'use strict';
  var A = window.__admin;

  A.renderDynamicFields = function(val) {
    var cfg = A.SECCIONES_CONFIG[val];
    if (!cfg) { if (A.dom.dynamicContainer) A.dom.dynamicContainer.innerHTML = ''; return; }
    var html = '';
    var isRelato = val.indexOf('Relatos:') === 0;
    var fileRequired = cfg.requireFile;

    html += '<div class="form-group"><label>Archivo' + (fileRequired ? ' <span style="color:var(--color-mir);">*</span>' : ' (opcional)') + '</label>' +
      '<div style="font-size:11px;color:#666;margin-bottom:6px;">Sube un archivo <strong>o</strong> ingresa un link externo (YouTube, Facebook, audio directo).</div>' +
      '<div class="upload-area" id="admin-upload-area"><div class="icon">📁</div><div class="text" id="admin-upload-text">Haz clic para seleccionar archivo</div><div class="hint">JPG, PNG, WebP, MP4, MP3, WAV · Máximo 50 MB</div><input type="file" id="admin-upload-file" accept=".jpg,.jpeg,.png,.webp,.mp4,.mp3,.wav" style="display:none"></div>' +
      '<div class="file-info" id="admin-upload-file-info"></div></div>' +
      '<div class="form-group"><label>Link externo (opcional)</label><input type="url" id="admin-upload-link" placeholder="https://www.youtube.com/watch?v=... o https://facebook.com/... o https://ejemplo.com/audio.mp3" style="width:100%;padding:10px 14px;background:var(--color-acero);border:1px solid #333;border-radius:8px;color:white;font-size:13px;outline:none;">' +
      '<div style="font-size:11px;color:#666;margin-top:4px;">Si no adjuntas archivo, este link se usará para mostrar el contenido embebido en la página.</div></div>';

    html += '<div class="form-group"><label>Serie / Colección</label><input type="text" id="admin-upload-serie" placeholder="Ej: Memorias de La Pintana, Archivo sonoro..." style="width:100%;padding:10px 14px;background:var(--color-acero);border:1px solid #333;border-radius:8px;color:white;font-size:13px;outline:none;"></div>' +
      '<div class="form-group"><label>Texto largo' + (isRelato ? ' <span style="color:var(--color-mir);">*</span>' : ' (opcional)') + '</label>' +
      '<div style="background:var(--color-acero);border:1px solid #333;border-radius:8px;overflow:hidden;">' +
      '<div id="editor-toolbar" style="display:flex;gap:4px;padding:6px 8px;border-bottom:1px solid #333;background:var(--color-plata);">' +
      '<button type="button" class="editor-btn" data-tag="b" title="Negrita" style="padding:6px 12px;background:transparent;border:1px solid #555;border-radius:4px;color:white;font-weight:700;font-size:13px;cursor:pointer;transition:all 0.2s;">B</button>' +
      '<button type="button" class="editor-btn" data-tag="i" title="Cursiva" style="padding:6px 12px;background:transparent;border:1px solid #555;border-radius:4px;color:white;font-style:italic;font-size:13px;cursor:pointer;transition:all 0.2s;">I</button>' +
      '<button type="button" class="editor-btn" data-tag="u" title="Subrayado" style="padding:6px 12px;background:transparent;border:1px solid #555;border-radius:4px;color:white;text-decoration:underline;font-size:13px;cursor:pointer;transition:all 0.2s;">U</button>' +
      '<span style="flex:1;"></span><span style="font-size:10px;color:#666;align-self:center;">Modo HTML</span></div>' +
      '<textarea id="admin-upload-textolargo" rows="12" style="width:100%;padding:10px 14px;background:var(--color-acero);border:none;color:white;font-size:13px;outline:none;resize:vertical;font-family:inherit;" placeholder="Escribe o pega aquí el contenido del relato... Puedes usar los botones B / I / U para dar formato."></textarea></div></div>';

    if (A.dom.dynamicContainer) A.dom.dynamicContainer.innerHTML = html;
    A.bindFileUpload();
    A.bindEditorToolbar();
  };

  A.bindFileUpload = function() {
    var area = document.getElementById('admin-upload-area');
    var input = document.getElementById('admin-upload-file');
    var info = document.getElementById('admin-upload-file-info');
    var text = document.getElementById('admin-upload-text');
    if (!area || !input) return;
    area.onclick = function() { input.click(); };
    input.onchange = function() {
      var file = input.files ? input.files[0] : null;
      if (!file) { if (info) info.textContent = ''; return; }
      if (file.size > 50 * 1024 * 1024) { if (info) { info.textContent = 'El archivo supera los 50 MB.'; info.style.color = '#E50914'; } input.value = ''; return; }
      if (info) { info.textContent = file.name + ' (' + (file.size / 1024 / 1024).toFixed(1) + ' MB)'; info.style.color = '#66bb6a'; }
      if (text) text.textContent = file.name;
    };
  };

  A.bindEditorToolbar = function() {
    document.querySelectorAll('.editor-btn').forEach(function(btn) {
      btn.onclick = function(e) {
        e.preventDefault();
        var tag = this.getAttribute('data-tag');
        var textarea = document.getElementById('admin-upload-textolargo');
        if (!textarea) return;
        var start = textarea.selectionStart, end = textarea.selectionEnd;
        var text = textarea.value, selected = text.substring(start, end);
        var replacement = selected ? '<' + tag + '>' + selected + '</' + tag + '>' : '<' + tag + '></' + tag + '>';
        textarea.value = text.substring(0, start) + replacement + text.substring(end);
        textarea.focus();
        textarea.setSelectionRange(start + replacement.length, start + replacement.length);
      };
    });
  };

  A.submitManualUpload = function(e) {
    e.preventDefault();
    var s = window.__admin.getSupabaseClient();
    if (!s) { A.showToast('Cliente Supabase no disponible', 'error'); return; }
    var seccion = A.dom.adminUploadSeccion.value;
    var cfg = A.SECCIONES_CONFIG[seccion];
    var isRelato = seccion.indexOf('Relatos:') === 0;
    var titulo = A.dom.adminUploadTitulo.value.trim();
    var textoLargo = document.getElementById('admin-upload-textolargo') ? document.getElementById('admin-upload-textolargo').value.trim() : '';
    var nombreSerie = document.getElementById('admin-upload-serie') ? document.getElementById('admin-upload-serie').value.trim() : '';
    var fileInput = document.getElementById('admin-upload-file');
    var file = fileInput && fileInput.files ? fileInput.files[0] : null;
    var linkInput = document.getElementById('admin-upload-link');
    var linkUrl = linkInput ? linkInput.value.trim() : '';
    var destacado = A.dom.adminUploadDestacado.checked;

    if (textoLargo) {
      if (typeof DOMPurify !== 'undefined') {
        textoLargo = DOMPurify.sanitize(textoLargo, {
          ALLOWED_TAGS: ['b', 'i', 'u', 'br'],
          ALLOWED_ATTR: [],
        });
      } else {
        textoLargo = textoLargo.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/on\w+=["'][^"']*["']/gi, '').replace(/<[^>]*>/g, function(m) {
          var allowed = ['<b>','</b>','<i>','</i>','<u>','</u>','<br>','<br/>','<br />'];
          if (allowed.indexOf(m.toLowerCase()) !== -1) return m;
          if (/^<br\s*\/?>$/i.test(m)) return '<br>';
          return '';
        });
      }
    }
    if (!titulo) { A.showToast('El campo "Título" es obligatorio.', 'error'); return; }
    if (cfg.requireFile && !file && !linkUrl) { A.showToast('Debes seleccionar un archivo o ingresar un link para esta sección.', 'error'); return; }
    if (isRelato && !textoLargo) { A.showToast('El campo "Texto largo" es obligatorio para relatos.', 'error'); return; }
    if (!file && !linkUrl && !textoLargo) { A.showToast('Agrega al menos un archivo, link o texto.', 'error'); return; }

    var extraData = {
      nombre: 'Admin', titulo_relato: titulo, nombre_serie: nombreSerie || null,
      descripcion: textoLargo ? textoLargo.substring(0, 200) : null,
      texto_largo: textoLargo || null, url_externo: linkUrl || null,
      destacado: destacado, es_efimero: destacado,
      geolocalizacion: A.dom.adminUploadGeo ? A.dom.adminUploadGeo.value.trim() || null : null,
      fecha_creacion_archivo: A.dom.adminUploadFecha ? A.dom.adminUploadFecha.value || null : null,
      tags: null,
      transcripcion: A.dom.adminUploadTranscripcion ? A.dom.adminUploadTranscripcion.value.trim() || null : null
    };
    if (A.dom.adminUploadTags && A.dom.adminUploadTags.value.trim()) {
      extraData.tags = A.dom.adminUploadTags.value.trim().split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t.length > 0; });
    }

    A.procesarSubida(A.dom.btnAdminUpload, async function() {
      if (!A.validarSeccion(seccion)) throw new Error('Sección inválida');
      if (file && file.size > 0) {
        await A.subirArchivo(file, seccion, extraData);
      } else {
        var now = new Date().toISOString();
        var tipoDetectado = null;
        if (linkUrl) {
          var l = linkUrl.toLowerCase();
          if (l.indexOf('youtube.com') !== -1 || l.indexOf('youtu.be') !== -1) tipoDetectado = 'video/youtube';
          else if (l.indexOf('facebook.com') !== -1) tipoDetectado = 'video/facebook';
          else if (l.match(/\.(mp3|wav|ogg|aac|m4a|flac)(\?|$)/)) tipoDetectado = 'audio/external';
          else if (l.match(/\.(mp4|webm|ogg|mov|avi)(\?|$)/)) tipoDetectado = 'video/external';
          else tipoDetectado = 'link';
        }
        var insertData = {
          nombre: 'Admin', titulo_relato: titulo || null, nombre_serie: nombreSerie || null,
          mensaje: extraData.descripcion || null, mensaje_largo: extraData.texto_largo || textoLargo || null,
          url_archivo: linkUrl || null, tipo_archivo: tipoDetectado, seccion: seccion,
          aprobado: true, destacado: destacado, es_efimero: destacado, fecha_subida: now,
          geolocalizacion: extraData.geolocalizacion || null, tags: extraData.tags || null,
          fecha_creacion_archivo: extraData.fecha_creacion_archivo || null
        };
        var { error: insertError } = await s.from('recuerdos').insert(insertData);
        if (insertError) throw insertError;
      }
      document.getElementById('admin-upload-form').reset();
      if (A.dom.adminUploadSeccion) A.renderDynamicFields(A.dom.adminUploadSeccion.value);
      A.loadApproved();
      A.loadDashboard();
    });
  };
})();
