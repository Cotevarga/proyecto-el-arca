(function () {
  'use strict';

  var API_URL = 'https://proyecto-el-arca-backend.onrender.com/api/upload';
  var API_KEY = 'MI_APK_SECRETO_SUPER_SEGURO_2026';
  var MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
  var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav', 'audio/wave'];
  var ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.mp3', '.wav'];

  var form = document.getElementById('form-archivo');
  var fileInput = document.getElementById('archivo');
  var fileError = document.getElementById('file-error');
  var fileInfo = document.getElementById('file-info');
  var formMessages = document.getElementById('form-messages');
  var btnEnviar = document.getElementById('btn-enviar');

  if (!form) return;

  function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 1).toLowerCase();
  }

  function validateFile(file) {
    if (!file) return 'Debes seleccionar un archivo.';

    var ext = '.' + getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return 'Formato no permitido. Solo: JPG, PNG, MP3, WAV.';
    }

    if (!ALLOWED_TYPES.includes(file.type) && file.type !== '') {
      return 'Tipo MIME no válido.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'El archivo supera los 50 MB. Comprime o selecciona otro.';
    }

    if (file.size === 0) {
      return 'El archivo está vacío.';
    }

    return null;
  }

  fileInput.addEventListener('change', function () {
    fileError.classList.add('hidden');
    fileInfo.classList.add('hidden');
    fileError.textContent = '';
    fileInfo.textContent = '';

    var file = fileInput.files[0];
    if (!file) return;

    var error = validateFile(file);
    if (error) {
      fileError.textContent = error;
      fileError.classList.remove('hidden');
      fileInput.value = '';
      return;
    }

    var sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    fileInfo.textContent = file.name + ' (' + sizeMB + ' MB) — Listo para subir.';
    fileInfo.classList.remove('hidden');
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    formMessages.classList.add('hidden');
    formMessages.textContent = '';
    fileError.classList.add('hidden');

    var nombre = document.getElementById('nombre').value.trim();
    var anio = document.getElementById('anio').value.trim();
    var mensaje = document.getElementById('mensaje').value.trim();

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      showMessage('Debes seleccionar un archivo para compartir.', 'red');
      return;
    }
    var file = fileInput.files[0];

    if (!nombre) {
      showMessage('Por favor, ingresa tu nombre o pseudónimo.', 'red');
      return;
    }

    if (!file) {
      showMessage('Debes seleccionar un archivo para compartir.', 'red');
      return;
    }

    var validationError = validateFile(file);
    if (validationError) {
      showMessage(validationError, 'red');
      return;
    }

    var formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('archivo', file);
    if (anio) formData.append('anio', anio);
    if (mensaje) formData.append('mensaje', mensaje);

    btnEnviar.disabled = true;
    btnEnviar.innerHTML = 'Enviando...';

    try {
      var response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY
        },
        body: formData
      });

      var result = await response.json();

      if (response.ok) {
        showMessage('Gracias por compartir tu recuerdo. Llegará al archivo comunitario.', 'green');
        form.reset();
        fileInfo.classList.add('hidden');
      } else {
        showMessage(result.error || 'Error al enviar. Intenta de nuevo.', 'red');
      }
    } catch (err) {
      showMessage('Error de conexión con el servidor. Verifica que el backend esté corriendo.', 'red');
    } finally {
      btnEnviar.disabled = false;
      btnEnviar.innerHTML = 'Subir y compartir recuerdo';
    }
  });

  function showMessage(text, type) {
    formMessages.textContent = text;
    formMessages.className = 'text-center text-sm font-medium p-4 rounded-none mt-4';
    if (type === 'red') {
      formMessages.style.backgroundColor = '#7f1d1d';
      formMessages.style.color = '#ffffff';
    } else {
      formMessages.style.backgroundColor = '#115e59';
      formMessages.style.color = '#ffffff';
    }
    formMessages.classList.remove('hidden');
  }
})();