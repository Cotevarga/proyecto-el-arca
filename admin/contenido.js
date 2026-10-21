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

  var state = { page: null, fields: null, overrides: {}, filter: '', loadId: 0 };
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

  function textCard(field) {
    var current = Object.prototype.hasOwnProperty.call(state.overrides, field.key) ? state.overrides[field.key] : field.text;
    var card = make('div', 'cms-card');
    var head = make('div', 'cms-card-head');
    head.appendChild(make('span', 'cms-tag', '<' + field.tag + '>'));
    var badge = make('span', 'cms-edited', 'Editado');
    head.appendChild(badge);
    card.appendChild(head);

    var area = make('textarea', 'cms-input');
    area.value = current;
    area.rows = Math.min(10, Math.max(1, Math.ceil(current.length / 70) + (current.split('\n').length - 1)));
    area.setAttribute('aria-label', 'Texto de ' + field.tag);
    card.appendChild(area);

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
    card.appendChild(actions);

    function refresh() {
      var edited = Object.prototype.hasOwnProperty.call(state.overrides, field.key);
      badge.style.display = edited ? 'inline-block' : 'none';
      restore.style.display = edited ? 'inline-block' : 'none';
      card.classList.toggle('is-edited', edited);
    }
    refresh();

    save.addEventListener('click', async function () {
      var value = area.value.trim();
      if (!value) { A.showToast('El texto no puede quedar vacío. Usa «Restaurar original» para volver atrás.', 'error'); return; }
      save.disabled = true;
      try {
        if (value === field.text) {
          if (Object.prototype.hasOwnProperty.call(state.overrides, field.key)) await removeOverride(field);
        } else {
          await saveOverride(field, 'texto', value, field.text);
        }
        refresh();
        A.showToast('Texto guardado', 'success');
      } catch (e) { reportError(e, 'No se pudo guardar'); }
      save.disabled = false;
    });

    restore.addEventListener('click', async function () {
      restore.disabled = true;
      try {
        await removeOverride(field);
        area.value = field.text;
        refresh();
        A.showToast('Texto restaurado', 'success');
      } catch (e) { reportError(e, 'No se pudo restaurar'); }
      restore.disabled = false;
    });
    return card;
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
    var actions = make('div', 'cms-actions');
    var upload = make('button', 'btn-sm btn-sm-approve', 'Subir y reemplazar');
    var restore = make('button', 'btn-sm btn-sm-reject', 'Restaurar original');
    upload.type = restore.type = 'button';
    actions.appendChild(upload);
    actions.appendChild(restore);
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
      if (!q) return true;
      var cur = Object.prototype.hasOwnProperty.call(state.overrides, f.key) ? state.overrides[f.key] : f.text;
      return (f.text + ' ' + cur).toLowerCase().indexOf(q) !== -1;
    });
    var images = q ? [] : state.fields.images;

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
    if (!els.page || !els.list) return;
    if (!els.page.options.length) {
      PAGES.forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p[0];
        opt.textContent = p[1];
        els.page.appendChild(opt);
      });
      els.page.addEventListener('change', function () { els.filter.value = ''; state.filter = ''; loadPage(els.page.value); });
      var timer;
      els.filter.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { state.filter = els.filter.value; render(); }, 150);
      });
    }
    loadPage(els.page.value || PAGES[0][0]);
  };
})();
