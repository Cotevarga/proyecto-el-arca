(function () {
  'use strict';
  var A = window.__admin;
  var C = window.ArcaContent;
  var BUCKET = 'elarca-uploads';
  var MAX_IMG = 5 * 1024 * 1024;
  var PAGES = [
    ['index', 'Inicio'],
    ['relatos', 'Relatos (portada)'],
    ['relatos/jano', 'Relatos · El Jano'],
    ['relatos/arca', 'Relatos · El Arca'],
    ['relatos/jano-arca', 'Relatos · El Jano y El Arca'],
    ['relatos/organizaciones', 'Relatos · Otras organizaciones'],
    ['relatos/anecdotas', 'Relatos · Anécdotas'],
    ['galeria', 'Galería'],
    ['videos', 'Videos y Audios'],
    ['legado', 'El Legado'],
    ['archivo', 'Archivo'],
    ['mapa', 'Mapa'],
    ['autora', 'Autora'],
    ['subir', 'Compartir un recuerdo'],
    ['impacto', 'Impacto'],
    ['plan-gestion', 'Plan de Gestión'],
    ['terminos', 'Términos y Condiciones']
  ];

  var state = { page: null, fields: null, overrides: {}, filter: '', onlyEdited: false, loadId: 0 };
  var els = {};

  function $(id) { return document.getElementById(id); }

  function make(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  function setStatus(msg, isError) {
    els.status.textContent = msg || '';
    els.status.classList.toggle('error', !!isError);
    els.status.style.display = msg ? 'block' : 'none';
  }

  function missingTable(error) {
    return error && (error.code === '42P01' || error.code === 'PGRST205' || /contenido_sitio/.test(error.message || ''));
  }

  function reportError(error, fallback) {
    if (missingTable(error)) {
      setStatus('Falta crear la tabla «contenido_sitio». Ejecuta el archivo supabase/migrations/012_contenido_sitio.sql en el SQL Editor de Supabase y vuelve a abrir esta sección.', true);
    } else {
      A.showToast((fallback || 'Error') + ': ' + ((error && error.message) || 'desconocido'), 'error');
    }
  }

  async function saveOverride(field, type, value, original) {
    var s = await A.waitForSupabase();
    var row = {
      clave: field.key,
      pagina: state.page,
      tipo: type,
      original: original,
      valor: value,
      updated_at: new Date().toISOString()
    };
    var res = await s.from('contenido_sitio').upsert(row, { onConflict: 'clave' });
    if (res.error) throw res.error;
    state.overrides[field.key] = value;
    C.invalidate();
  }

  async function removeOverride(field) {
    var s = await A.waitForSupabase();
    var res = await s.from('contenido_sitio').delete().eq('clave', field.key);
    if (res.error) throw res.error;
    delete state.overrides[field.key];
    C.invalidate();
  }

  function imageUrl(src) {
    if (/^https?:\/\//i.test(src) || src.charAt(0) === '/') return src;
    return '/' + src.replace(/^\.\//, '');
  }

  var TOOLS = [
    ['bold', 'B', 'Negrita (Ctrl+B)', 'cms-t-b'],
    ['italic', 'I', 'Cursiva (Ctrl+I)', 'cms-t-i'],
    ['underline', 'U', 'Subrayado (Ctrl+U)', 'cms-t-u'],
    ['link', '🔗', 'Insertar enlace', ''],
    ['unlink', '⛓️‍💥', 'Quitar enlace', ''],
    ['clear', 'Tx', 'Quitar formato', ''],
    ['undo', '↶', 'Deshacer', ''],
    ['redo', '↷', 'Rehacer', '']
  ];

  var ACCIONES = { crear: 'Creado', editar: 'Editado', restaurar: 'Restaurado al original' };

  // Panel de historial: muestra las últimas versiones de una clave y permite recuperarlas.
  function historyPanel(field, key, onPick) {
    var box = make('div', 'cms-history');
    box.appendChild(make('div', 'cms-history-title', 'Cargando historial…'));
    (async function () {
      try {
        var s = await A.waitForSupabase();
        var res = await s.from('contenido_historial').select('accion,valor,created_at').eq('clave', key).order('created_at', { ascending: false }).limit(15);
        box.textContent = '';
        if (res.error) {
          box.appendChild(make('div', 'cms-history-title', 'Historial no disponible. Ejecuta supabase/migrations/013_contenido_historial.sql.'));
          return;
        }
        box.appendChild(make('div', 'cms-history-title', 'Versiones anteriores'));
        if (!res.data.length) box.appendChild(make('div', 'cms-history-empty', 'Aún no hay cambios registrados.'));
        res.data.forEach(function (r) {
          var row = make('div', 'cms-history-row');
          var meta = make('div', 'cms-history-meta', new Date(r.created_at).toLocaleString('es-CL') + ' · ' + (ACCIONES[r.accion] || r.accion));
          row.appendChild(meta);
          if (r.valor != null) {
            var preview = document.createElement('div');
            preview.className = 'cms-history-preview';
            if (field.type === 'img') preview.textContent = r.valor;
            else C.setText(preview, r.valor);
            row.appendChild(preview);
            var use = make('button', 'btn-sm btn-sm-approve', 'Usar esta versión');
            use.type = 'button';
            use.addEventListener('click', function () { onPick(r.valor); });
            row.appendChild(use);
          }
          box.appendChild(row);
        });
      } catch (e) {
        box.textContent = 'No se pudo cargar el historial.';
      }
    })();
    return box;
  }

  function historyToggle(card, actions, field, key, onPick) {
    var btn = make('button', 'btn-sm btn-secondary', '🕘 Historial');
    btn.type = 'button';
    var panel = null;
    btn.addEventListener('click', function () {
      if (panel) { panel.remove(); panel = null; return; }
      panel = historyPanel(field, key, function (v) { onPick(v); panel.remove(); panel = null; });
      card.appendChild(panel);
    });
    actions.appendChild(btn);
  }
  function textCard(field) {
    var base = field.markup != null ? field.markup : field.text;
    var current = Object.prototype.hasOwnProperty.call(state.overrides, field.key) ? state.overrides[field.key] : base;
    var card = make('div', 'cms-card');
    var head = make('div', 'cms-card-head');
    head.appendChild(make('span', 'cms-tag', '<' + field.tag + '>'));
    var badge = make('span', 'cms-edited', 'Editado');
    head.appendChild(badge);
    var dirty = make('span', 'cms-dirty', '● sin guardar');
    head.appendChild(dirty);
    var count = make('span', 'cms-count', '');
    head.appendChild(count);
    card.appendChild(head);

    var bar = make('div', 'cms-toolbar-rt');
    bar.setAttribute('role', 'toolbar');
    var editor = make('div', 'cms-editor');
    editor.contentEditable = 'true';
    editor.setAttribute('role', 'textbox');
    editor.setAttribute('aria-multiline', 'true');
    editor.setAttribute('aria-label', 'Texto de ' + field.tag);
    C.setText(editor, current);

    function plainLength() { return (editor.textContent || '').length; }
    function markDirty() {
      dirty.style.display = C.fromEditor(editor) === current ? 'none' : 'inline';
      count.textContent = plainLength() + ' caracteres';
    }

    TOOLS.forEach(function (t) {
      var btn = make('button', 'cms-tool ' + t[3], t[1]);
      btn.type = 'button';
      btn.title = t[2];
      btn.setAttribute('aria-label', t[2]);
      btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
      btn.addEventListener('click', function () {
        editor.focus();
        if (t[0] === 'link') {
          var url = window.prompt('Dirección del enlace (https://… o /pagina.html):', 'https://');
          if (url && C.isSafeUrl(url.trim()) && !/[()\s]/.test(url.trim())) document.execCommand('createLink', false, url.trim());
          else if (url) A.showToast('Enlace no válido: usa https://… sin espacios ni paréntesis.', 'error');
        } else if (t[0] === 'clear') {
          document.execCommand('removeFormat');
          document.execCommand('unlink');
        } else {
          document.execCommand(t[0]);
        }
        markDirty();
      });
      bar.appendChild(btn);
    });
    card.appendChild(bar);
    card.appendChild(editor);

    // Pegar siempre como texto plano: evita arrastrar estilos y HTML ajeno.
    editor.addEventListener('paste', function (e) {
      e.preventDefault();
      var txt = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, txt);
    });
    editor.addEventListener('input', markDirty);

    var original = make('div', 'cms-original');
    original.appendChild(make('strong', null, 'Original: '));
    original.appendChild(document.createTextNode(field.text.length > 160 ? field.text.slice(0, 160) + '…' : field.text));
    card.appendChild(original);

    var actions = make('div', 'cms-actions');
    var save = make('button', 'btn-sm btn-sm-approve', 'Guardar');
    var restore = make('button', 'btn-sm btn-sm-reject', 'Restaurar original');
    save.type = restore.type = 'button';
    actions.appendChild(save);
    actions.appendChild(restore);
    historyToggle(card, actions, field, field.key, function (v) { editor.textContent = ''; C.setText(editor, v); markDirty(); A.showToast('Versión cargada: pulsa Guardar para publicarla.', 'success'); });
    card.appendChild(actions);

    function refresh() {
      var edited = Object.prototype.hasOwnProperty.call(state.overrides, field.key);
      current = edited ? state.overrides[field.key] : base;
      badge.style.display = edited ? 'inline-block' : 'none';
      restore.style.display = edited ? 'inline-block' : 'none';
      card.classList.toggle('is-edited', edited);
      markDirty();
    }
    refresh();

    async function doSave() {
      var value = C.fromEditor(editor);
      if (!value.replace(/\\./g, 'x').trim()) { A.showToast('El texto no puede quedar vacío. Usa «Restaurar original» para volver atrás.', 'error'); return; }
      save.disabled = true;
      try {
        if (value === base) {
          if (Object.prototype.hasOwnProperty.call(state.overrides, field.key)) await removeOverride(field);
        } else {
          await saveOverride(field, 'texto', value, field.text);
        }
        refresh();
        updateSummary();
        A.showToast('Texto guardado', 'success');
      } catch (e) { reportError(e, 'No se pudo guardar'); }
      save.disabled = false;
    }
    save.addEventListener('click', doSave);
    editor.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); doSave(); }
    });

    restore.addEventListener('click', async function () {
      restore.disabled = true;
      try {
        await removeOverride(field);
        editor.textContent = '';
        C.setText(editor, base);
        refresh();
        updateSummary();
        A.showToast('Texto restaurado', 'success');
      } catch (e) { reportError(e, 'No se pudo restaurar'); }
      restore.disabled = false;
    });
    return card;
  }

  function updateSummary() {
    if (!els.summary || !state.fields) return;
    var total = state.fields.texts.length + state.fields.images.length;
    var edited = Object.keys(state.overrides).length;
    els.summary.textContent = total + ' elementos editables · ' + edited + ' modificados';
  }
  function imageCard(field) {
    var card = make('div', 'cms-card cms-card-image');
    var head = make('div', 'cms-card-head');
    head.appendChild(make('span', 'cms-tag', '<img>'));
    var badge = make('span', 'cms-edited', 'Editada');
    head.appendChild(badge);
    card.appendChild(head);

    var body = make('div', 'cms-image-body');
    var img = make('img', 'cms-thumb');
    img.alt = field.alt || 'Imagen';
    body.appendChild(img);

    var side = make('div', 'cms-image-side');
    side.appendChild(make('div', 'cms-original', 'Original: ' + field.src));
    var file = make('input');
    file.type = 'file';
    file.accept = 'image/jpeg,image/png,image/webp';
    file.setAttribute('aria-label', 'Elegir imagen nueva');
    side.appendChild(file);

    var altLabel = make('label', 'cms-alt-label', 'Texto alternativo (describe la imagen para lectores de pantalla y buscadores)');
    var altInput = make('input', 'cms-alt-input');
    altInput.type = 'text';
    altInput.maxLength = 300;
    var altField = { key: field.altKey };
    var hasAlt = Object.prototype.hasOwnProperty.call(state.overrides, field.altKey);
    altInput.value = hasAlt ? state.overrides[field.altKey] : (field.alt || '');
    altLabel.appendChild(altInput);
    side.appendChild(altLabel);
    var saveAlt = make('button', 'btn-sm btn-secondary', 'Guardar descripción');
    saveAlt.type = 'button';
    saveAlt.addEventListener('click', async function () {
      var v = altInput.value.trim();
      saveAlt.disabled = true;
      try {
        if (!v || v === (field.alt || '')) {
          if (Object.prototype.hasOwnProperty.call(state.overrides, field.altKey)) await removeOverride(altField);
        } else {
          await saveOverride(altField, 'alt', v, field.alt || '');
        }
        img.alt = v || field.alt || 'Imagen';
        updateSummary();
        A.showToast('Descripción guardada', 'success');
      } catch (e) { reportError(e, 'No se pudo guardar la descripción'); }
      saveAlt.disabled = false;
    });
    side.appendChild(saveAlt);

    var actions = make('div', 'cms-actions');
    var upload = make('button', 'btn-sm btn-sm-approve', 'Subir y reemplazar');
    var restore = make('button', 'btn-sm btn-sm-reject', 'Restaurar original');
    upload.type = restore.type = 'button';
    actions.appendChild(upload);
    actions.appendChild(restore);
    historyToggle(card, actions, { type: 'img' }, field.key, function (url) {
      if (!C.isSafeUrl(url)) { A.showToast('Esa versión no es una URL válida.', 'error'); return; }
      saveOverride(field, 'imagen', url, field.src).then(function () { refresh(); updateSummary(); A.showToast('Imagen recuperada', 'success'); }, function (e) { reportError(e, 'No se pudo recuperar'); });
    });
    side.appendChild(actions);
    body.appendChild(side);
    card.appendChild(body);

    function refresh() {
      var edited = Object.prototype.hasOwnProperty.call(state.overrides, field.key);
      img.src = edited ? state.overrides[field.key] : imageUrl(field.src);
      badge.style.display = edited ? 'inline-block' : 'none';
      restore.style.display = edited ? 'inline-block' : 'none';
      card.classList.toggle('is-edited', edited);
    }
    refresh();

    upload.addEventListener('click', async function () {
      var f = file.files && file.files[0];
      if (!f) { A.showToast('Elige primero una imagen (JPG, PNG o WebP).', 'error'); return; }
      if (f.size > MAX_IMG) { A.showToast('La imagen supera los 5 MB.', 'error'); return; }
      if (!(await A.verifyMagicBytes(f)) || f.type.indexOf('image/') !== 0) { A.showToast('Archivo no válido: debe ser una imagen real.', 'error'); return; }
      upload.disabled = true;
      upload.textContent = 'Subiendo…';
      try {
        var s = await A.waitForSupabase();
        var ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg';
        var path = 'sitio/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
        var up = await s.storage.from(BUCKET).upload(path, f, { contentType: f.type });
        if (up.error) throw up.error;
        var url = s.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        await saveOverride(field, 'imagen', url, field.src);
        file.value = '';
        refresh();
        A.showToast('Imagen reemplazada', 'success');
      } catch (e) { reportError(e, 'No se pudo subir la imagen'); }
      upload.disabled = false;
      upload.textContent = 'Subir y reemplazar';
    });

    restore.addEventListener('click', async function () {
      restore.disabled = true;
      try {
        await removeOverride(field);
        refresh();
        A.showToast('Imagen restaurada', 'success');
      } catch (e) { reportError(e, 'No se pudo restaurar'); }
      restore.disabled = false;
    });
    return card;
  }

  function render() {
    var list = els.list;
    list.textContent = '';
    if (!state.fields) return;
    var q = C.normalize(state.filter).toLowerCase();
    var texts = state.fields.texts.filter(function (f) {
      var has = Object.prototype.hasOwnProperty.call(state.overrides, f.key);
      if (state.onlyEdited && !has) return false;
      if (!q) return true;
      var cur = has ? state.overrides[f.key] : f.text;
      return (f.text + ' ' + cur).toLowerCase().indexOf(q) !== -1;
    });
    var images = q ? [] : state.fields.images.filter(function (f) {
      return !state.onlyEdited || Object.prototype.hasOwnProperty.call(state.overrides, f.key);
    });
    updateSummary();

    if (images.length) {
      list.appendChild(make('h4', 'cms-group', 'Imágenes (' + images.length + ')'));
      images.forEach(function (f) { list.appendChild(imageCard(f)); });
    }
    list.appendChild(make('h4', 'cms-group', 'Textos (' + texts.length + ')'));
    if (!texts.length) list.appendChild(make('div', 'cms-empty', q ? 'Ningún texto coincide con la búsqueda.' : 'Esta página no tiene textos editables.'));
    texts.forEach(function (f) { list.appendChild(textCard(f)); });
  }

  async function loadPage(page) {
    var id = ++state.loadId;
    state.page = page;
    state.fields = null;
    els.list.textContent = '';
    els.open.href = page === 'index' ? '/' : '/' + page + '.html';
    setStatus('Cargando contenido de la página…');
    try {
      var html = await fetch('/_legacy-pages/' + page + '.html', { cache: 'no-store' });
      if (!html.ok) throw new Error('No se pudo leer la página (HTTP ' + html.status + ')');
      var doc = new DOMParser().parseFromString(await html.text(), 'text/html');
      var fields = C.collect(doc.body, page);

      var s = await A.waitForSupabase();
      var res = await s.from('contenido_sitio').select('clave,valor').eq('pagina', page);
      if (id !== state.loadId) return;
      var overrides = {};
      if (res.error) {
        if (!missingTable(res.error)) throw res.error;
        reportError(res.error);
      } else {
        setStatus('');
        (res.data || []).forEach(function (r) { overrides[r.clave] = r.valor; });
      }
      state.fields = fields;
      state.overrides = overrides;
      render();
    } catch (e) {
      if (id !== state.loadId) return;
      setStatus('Error al cargar la página: ' + (e.message || e), true);
    }
  }

  A.loadContenido = function () {
    els.page = $('cms-page');
    els.filter = $('cms-filter');
    els.list = $('cms-list');
    els.status = $('cms-status');
    els.open = $('cms-open');
    els.summary = $('cms-summary');
    els.edited = $('cms-only-edited');
    if (!els.page || !els.list) return;
    if (!els.page.options.length) {
      PAGES.forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p[0];
        opt.textContent = p[1];
        els.page.appendChild(opt);
      });
      els.page.addEventListener('change', function () { els.filter.value = ''; state.filter = ''; loadPage(els.page.value); });
      els.edited.addEventListener('change', function () { state.onlyEdited = els.edited.checked; render(); });
      els.edited.addEventListener('change', function () { state.onlyEdited = els.edited.checked; render(); });
      var timer;
      els.filter.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { state.filter = els.filter.value; render(); }, 150);
      });
    }
    loadPage(els.page.value || PAGES[0][0]);
  };
})();
