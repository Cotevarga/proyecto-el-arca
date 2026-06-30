(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  MOBILE MENU TOGGLE                                                */
  /* ------------------------------------------------------------------ */
  var menuToggle = document.getElementById('menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('hidden');
    });
    mobileMenu.querySelectorAll('a').forEach(function (l) {
      l.addEventListener('click', function () {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  UPLOAD FORM (solo en index.html)                                  */
  /* ------------------------------------------------------------------ */
  var formArchivo = document.getElementById('form-archivo');
  if (!formArchivo) return;

  var fileInput = document.getElementById('archivo');
  var fileError = document.getElementById('file-error');
  var fileInfo = document.getElementById('file-info');

  if (fileInput) {
    fileInput.addEventListener('change', function () {
      var file = fileInput.files[0];
      if (!file) {
        fileError.classList.add('hidden');
        fileInfo.classList.add('hidden');
        return;
      }
      var valids = ['image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav', 'video/mp4'];
      if (valids.indexOf(file.type) === -1) {
        fileError.textContent = 'Formato no válido. Sube JPG, PNG, MP3, WAV o MP4.';
        fileError.classList.remove('hidden');
        fileInfo.classList.add('hidden');
        fileInput.value = '';
        return;
      }
      fileError.classList.add('hidden');
      if (file.size > 50 * 1024 * 1024) {
        fileError.textContent = 'El archivo supera los 50 MB.';
        fileError.classList.remove('hidden');
        fileInfo.classList.add('hidden');
        fileInput.value = '';
        return;
      }
      fileError.classList.add('hidden');
      fileInfo.textContent = 'Archivo: ' + file.name + ' (' + (file.size / 1024 / 1024).toFixed(1) + ' MB)';
      fileInfo.classList.remove('hidden');
    });
  }

  formArchivo.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('btn-enviar');
    var messages = document.getElementById('form-messages');
    var fd = new FormData(formArchivo);

    btn.textContent = 'Enviando…';
    btn.disabled = true;
    messages.classList.add('hidden');

    fetch('https://elarcamemoriaviva-backend.vercel.app/api/subir', {
      method: 'POST',
      body: fd
    })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function () {
        messages.textContent = '¡Gracias por compartir tu recuerdo!';
        messages.className = 'text-center text-sm font-medium text-green-400';
        messages.classList.remove('hidden');
        formArchivo.reset();
        if (fileInfo) fileInfo.classList.add('hidden');
      })
      .catch(function () {
        messages.textContent = 'Hubo un error al enviar. Intenta de nuevo o escribe a contacto@elarca.cl';
        messages.className = 'text-center text-sm font-medium text-mir';
        messages.classList.remove('hidden');
      })
      .finally(function () {
        btn.textContent = 'Subir y compartir recuerdo';
        btn.disabled = false;
      });
  });
})();
