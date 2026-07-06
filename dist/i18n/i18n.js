/* ===========================================================
   El Arca — i18n Loader v1.0
   Soporta: español (es), inglés (en), mapudungun (arn)
   =========================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'elarca_lang';
  var DEFAULT_LANG = 'es';
  var SUPPORTED = ['es', 'en', 'arn'];
  var LANG_NAMES = { es: 'Español', en: 'English', arn: 'Mapudungun' };
  var translations = {};
  var currentLang = DEFAULT_LANG;

  function getBrowserLang() {
    try {
      var lang = (navigator.language || '').split('-')[0];
      if (SUPPORTED.indexOf(lang) !== -1) return lang;
    } catch (e) {}
    return DEFAULT_LANG;
  }

  async function loadLang(lang) {
    if (translations[lang]) return translations[lang];
    try {
      var res = await fetch('/i18n/' + lang + '.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      translations[lang] = data;
      return data;
    } catch (err) {
      console.warn('[i18n] Error loading ' + lang + ':', err);
      if (lang !== DEFAULT_LANG) return loadLang(DEFAULT_LANG);
      return {};
    }
  }

  function getText(path, vars) {
    var keys = path.split('.');
    var val = translations[currentLang];
    for (var i = 0; val && i < keys.length; i++) {
      val = val[keys[i]];
    }
    if (typeof val !== 'string') return path;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        val = val.replace('{{' + k + '}}', vars[k]);
      });
    }
    return val;
  }

  function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var text = getText(key);
      if (text !== key) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.setAttribute('placeholder', text);
        } else {
          el.textContent = text;
        }
      }
    });
    document.documentElement.lang = currentLang;
  }

  async function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;
    currentLang = lang;
    await loadLang(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    translatePage();
    document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: lang } }));
  }

  function getCurrentLang() { return currentLang; }

  function getLangName(lang) { return LANG_NAMES[lang] || lang; }

  function getSupportedLangs() { return SUPPORTED.slice(); }

  async function init() {
    var saved = localStorage.getItem(STORAGE_KEY);
    var lang = saved || getBrowserLang();
    await setLang(lang);
  }

  window.i18n = {
    init: init,
    setLang: setLang,
    getText: getText,
    getCurrentLang: getCurrentLang,
    getLangName: getLangName,
    getSupportedLangs: getSupportedLangs,
  };
})();
