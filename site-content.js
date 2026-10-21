/* ===========================================================
   El Arca — Contenido editable del sitio
   Compartido por el sitio público (LegacyPage) y el panel admin.
   Cada texto/imagen se identifica por  pagina | tipo | hash(original),
   de modo que una edición sigue valiendo aunque cambie la estructura
   del HTML. Las ediciones viven en la tabla public.contenido_sitio.
   =========================================================== */
(function (root) {
  'use strict';

  var INLINE = { STRONG: 1, B: 1, EM: 1, I: 1, U: 1, SPAN: 1, BR: 1, A: 1, SMALL: 1, MARK: 1, SUP: 1, SUB: 1, ABBR: 1 };
  var SKIP = 'script, style, noscript, svg, iframe, textarea, select, option, nav, [data-no-edit]';
  var CACHE_MS = 30000;
  var cache = null;

  function normalize(text) {
    return String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  }

  // FNV-1a de 32 bits: corto, determinista y suficiente para identificar un texto dentro de una página.
  function hash(text) {
    var h = 0x811c9dc5;
    var s = normalize(text);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36);
  }

  function altKey(page, src) { return imageKey(page, src).replace('|i|', '|a|'); }
  function textKey(page, text) { return page + '|t|' + hash(text); }
  function imageKey(page, src) { return page + '|i|' + String(src || '').trim().replace(/^\.?\//, '').split('?')[0]; }

  function isInlineOnly(el) {
    var kids = el.children;
    for (var i = 0; i < kids.length; i++) {
      if (!INLINE[kids[i].tagName] || !isInlineOnly(kids[i])) return false;
    }
    return true;
  }

  function hasOwnText(el) {
    return /[A-Za-zÀ-ÿ0-9]/.test(el.textContent || '');
  }

  function isEditableText(el) {
    if (el.closest(SKIP)) return false;
    if (!/^(H[1-6]|P|LI|SPAN|A|BUTTON|LABEL|DIV|TD|TH|SMALL|STRONG|EM|B|I|FIGCAPTION|BLOCKQUOTE|SUMMARY|DT|DD)$/.test(el.tagName)) return false;
    if (!hasOwnText(el) || !isInlineOnly(el)) return false;
    // Solo el elemento más externo que cumple las reglas, para no listar un texto dos veces.
    var parent = el.parentElement;
    if (parent && !parent.closest(SKIP) && /^(H[1-6]|P|LI|SPAN|A|BUTTON|LABEL|DIV|TD|TH|SMALL|FIGCAPTION|BLOCKQUOTE|SUMMARY|DT|DD)$/.test(parent.tagName) &&
        hasOwnText(parent) && isInlineOnly(parent)) return false;
    return true;
  }

  // Texto tal como lo ve el editor: los <br> pasan a saltos de línea.
  function displayText(el) {
    var out = '';
    el.childNodes.forEach(function (node) {
      if (node.nodeType === 3) out += node.nodeValue;
      else if (node.tagName === 'BR') out += '\n';
      else out += displayText(node);
    });
    return out.replace(/[ \t\r\f]+/g, ' ').replace(/ ?\n ?/g, '\n').trim();
  }

  function isSafeUrl(url) {
    return /^https:\/\//i.test(url) || (/^\/(?!\/)/.test(url));
  }

  function collect(rootNode, page) {
    var texts = [];
    var images = [];
    var seen = {};
    rootNode.querySelectorAll('*').forEach(function (el) {
      if (el.tagName === 'IMG') {
        var src = el.getAttribute('src');
        if (!src || /^data:/i.test(src) || el.closest(SKIP)) return;
        var ik = imageKey(page, src);
        if (seen[ik]) return;
        seen[ik] = true;
        images.push({ key: ik, altKey: altKey(page, src), src: src, alt: el.getAttribute('alt') || '' });
        return;
      }
      if (!isEditableText(el)) return;
      var key = textKey(page, el.textContent);
      if (seen[key]) return;
      seen[key] = true;
      texts.push({ key: key, tag: el.tagName.toLowerCase(), text: displayText(el), markup: toMarkup(el).replace(/^\s+|\s+$/g, '').replace(/ ?\n ?/g, '\n') });
    });
    return { texts: texts, images: images };
  }

  // ---- Formato enriquecido ------------------------------------------------
  // Los valores se guardan como un marcado mínimo y seguro (no HTML):
  //   **negrita**  *cursiva*  __subrayado__  [texto](https://enlace)  y saltos de línea.
  // Se reconstruyen siempre con nodos DOM, nunca con innerHTML.
  function escapeMarkup(s) { return s.replace(/[\\*_\[\]()]/g, '\\$&'); }

  function toMarkup(node) {
    var out = '';
    node.childNodes.forEach(function (n) {
      if (n.nodeType === 3) { out += escapeMarkup(n.nodeValue.replace(/[ \t\r\n\f]+/g, ' ')); return; }
      if (n.nodeType !== 1) return;
      var t = n.tagName;
      if (t === 'BR') { out += '\n'; return; }
      var inner = toMarkup(n);
      if (!inner.trim()) { out += inner; return; }
      var style = (n.getAttribute('style') || '').toLowerCase();
      var bold = t === 'STRONG' || t === 'B' || /font-weight:\s*(bold|[6-9]00)/.test(style);
      var ital = t === 'EM' || t === 'I' || /font-style:\s*italic/.test(style);
      var under = t === 'U' || /text-decoration[^;]*underline/.test(style);
      var lead = inner.match(/^\s*/)[0];
      var trail = inner.match(/\s*$/)[0];
      var core = inner.slice(lead.length, inner.length - trail.length);
      if (t === 'A') {
        var href = n.getAttribute('href') || '';
        if (isSafeUrl(href) && !/[()\s]/.test(href)) core = '[' + core + '](' + href + ')';
      }
      if (under) core = '__' + core + '__';
      if (ital) core = '*' + core + '*';
      if (bold) core = '**' + core + '**';
      out += lead + core + trail;
    });
    return out;
  }

  // Serializa el contenido de un editor contenteditable (bloques DIV/P = salto de línea).
  function fromEditor(editor) {
    var clone = editor.cloneNode(true);
    clone.querySelectorAll('div, p').forEach(function (b) {
      if (b.previousSibling) b.parentNode.insertBefore(b.ownerDocument.createElement('br'), b);
    });
    return toMarkup(clone).replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '').trim();
  }

  var TOKEN = /\\([\\*_\[\]()])|\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|\*([\s\S]+?)\*|\[([^\]]+)\]\((https:\/\/[^\s)]+|\/[^\s)]*)\)/;

  function parseInto(parent, str, depth) {
    var doc = parent.ownerDocument;
    var rest = String(str);
    while (rest) {
      var m = depth < 6 ? TOKEN.exec(rest) : null;
      if (!m) { addPlain(parent, rest); return; }
      if (m.index) addPlain(parent, rest.slice(0, m.index));
      var el = null;
      if (m[1] !== undefined) { parent.appendChild(doc.createTextNode(m[1])); }
      else if (m[2] !== undefined) el = doc.createElement('strong'), parseInto(el, m[2], depth + 1);
      else if (m[3] !== undefined) el = doc.createElement('u'), parseInto(el, m[3], depth + 1);
      else if (m[4] !== undefined) el = doc.createElement('em'), parseInto(el, m[4], depth + 1);
      else if (isSafeUrl(m[6])) {
        el = doc.createElement('a');
        el.setAttribute('href', m[6]);
        if (/^https:/i.test(m[6])) { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
        parseInto(el, m[5], depth + 1);
      } else parent.appendChild(doc.createTextNode(m[0]));
      if (el) parent.appendChild(el);
      rest = rest.slice(m.index + m[0].length);
    }
  }

  function addPlain(parent, text) {
    var doc = parent.ownerDocument;
    text.split('\n').forEach(function (line, i) {
      if (i > 0) parent.appendChild(doc.createElement('br'));
      if (line) parent.appendChild(doc.createTextNode(line));
    });
  }

  function setText(el, value) {
    while (el.firstChild) el.removeChild(el.firstChild);
    parseInto(el, value, 0);
  }
  // Aplica las ediciones sobre un árbol DOM aún no montado. Solo usa nodos de texto y
  // atributos validados, por lo que un valor guardado nunca puede inyectar HTML ni scripts.
  function apply(rootNode, page, overrides) {
    if (!overrides) return 0;
    var applied = 0;
    var targets = [];
    rootNode.querySelectorAll('*').forEach(function (el) {
      if (el.tagName === 'IMG') {
        var src = el.getAttribute('src');
        if (!src || el.closest(SKIP)) return;
        var ik = imageKey(page, src);
        if (Object.prototype.hasOwnProperty.call(overrides, ik) && isSafeUrl(overrides[ik])) targets.push([el, 'img', overrides[ik]]);
        var ak = altKey(page, src);
        if (Object.prototype.hasOwnProperty.call(overrides, ak)) targets.push([el, 'alt', overrides[ak]]);
        return;
      }
      if (!isEditableText(el)) return;
      var key = textKey(page, el.textContent);
      if (Object.prototype.hasOwnProperty.call(overrides, key)) targets.push([el, 'text', overrides[key]]);
    });
    targets.forEach(function (t) {
      if (t[1] === 'alt') {
        t[0].setAttribute('alt', String(t[2]).slice(0, 300));
      } else if (t[1] === 'img') {
        t[0].setAttribute('src', t[2]);
        t[0].removeAttribute('srcset');
      } else {
        setText(t[0], t[2]);
      }
      applied++;
    });
    return applied;
  }

  async function load(force) {
    var now = Date.now();
    if (!force && cache && now - cache.at < CACHE_MS) return cache.data;
    var url = root.SUPABASE_URL;
    var key = root.SUPABASE_ANON_KEY;
    if (!url || !key || typeof fetch !== 'function') return {};
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 3000) : null;
    try {
      var res = await fetch(url + '/rest/v1/contenido_sitio?select=clave,valor', {
        headers: { apikey: key, Authorization: 'Bearer ' + key },
        signal: controller ? controller.signal : undefined
      });
      if (!res.ok) return {};
      var rows = await res.json();
      var data = {};
      (rows || []).forEach(function (r) { if (r && r.clave) data[r.clave] = r.valor; });
      cache = { at: now, data: data };
      return data;
    } catch (e) {
      return {};
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  root.ArcaContent = {
    normalize: normalize,
    hash: hash,
    textKey: textKey,
    imageKey: imageKey,
    altKey: altKey,
    isSafeUrl: isSafeUrl,
    toMarkup: toMarkup,
    fromEditor: fromEditor,
    setText: setText,
    collect: collect,
    apply: apply,
    load: load,
    invalidate: function () { cache = null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
