(function () {
  'use strict';

  var contenedor = document.getElementById('contenedor-principal');
  var cachedHome = contenedor.innerHTML;

  /* ------------------------------------------------------------------ */
  /*  NAV UPDATE                                                        */
  /* ------------------------------------------------------------------ */
  function actualizarNav(ruta) {
    document.querySelectorAll('nav a[data-ruta]').forEach(function (a) {
      var linkRuta = a.getAttribute('data-ruta');
      if (linkRuta === ruta) {
        a.classList.add('text-mir');
        a.style.borderBottomColor = '#E50914';
      } else {
        a.classList.remove('text-mir');
        a.style.borderBottomColor = 'transparent';
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  LIGHTBOX                                                          */
  /* ------------------------------------------------------------------ */
  function inicializarLightbox() {
    var oldModal = document.getElementById('lightbox-modal');
    if (oldModal) oldModal.remove();

    var imagenes = contenedor.querySelectorAll('img');
    if (imagenes.length === 0) return;

    var srcs = [];
    imagenes.forEach(function (img) {
      if (img.src && img.src !== '') srcs.push(img.src);
    });
    if (srcs.length === 0) return;

    var modal = document.createElement('div');
    modal.id = 'lightbox-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:rgba(0,0,0,0.92);display:none;align-items:center;justify-content:center;';

    var modalImg = document.createElement('img');
    modalImg.id = 'lightbox-img';
    modalImg.style.cssText = 'max-width:90vw;max-height:90vh;object-fit:contain;border-radius:4px;box-shadow:0 0 40px rgba(0,0,0,0.6);';

    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'position:absolute;top:20px;right:30px;font-size:2.5rem;color:white;background:none;border:none;cursor:pointer;z-index:10;line-height:1;';

    var leftBtn = document.createElement('button');
    leftBtn.innerHTML = '&#10094;';
    leftBtn.style.cssText = 'position:absolute;left:20px;top:50%;transform:translateY(-50%);font-size:2.5rem;color:white;background:rgba(0,0,0,0.5);border:none;cursor:pointer;padding:0.5rem 0.75rem;border-radius:4px;z-index:10;transition:background 0.2s;';

    var rightBtn = document.createElement('button');
    rightBtn.innerHTML = '&#10095;';
    rightBtn.style.cssText = 'position:absolute;right:20px;top:50%;transform:translateY(-50%);font-size:2.5rem;color:white;background:rgba(0,0,0,0.5);border:none;cursor:pointer;padding:0.5rem 0.75rem;border-radius:4px;z-index:10;transition:background 0.2s;';

    modal.appendChild(closeBtn);
    modal.appendChild(leftBtn);
    modal.appendChild(rightBtn);
    modal.appendChild(modalImg);
    document.body.appendChild(modal);

    function cerrar() { modal.style.display = 'none'; }

    closeBtn.addEventListener('click', cerrar);
    modal.addEventListener('click', function (e) { if (e.target === modal) cerrar(); });

    leftBtn.addEventListener('mouseenter', function () { leftBtn.style.background = 'rgba(0,0,0,0.8)'; });
    leftBtn.addEventListener('mouseleave', function () { leftBtn.style.background = 'rgba(0,0,0,0.5)'; });
    leftBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var idx = parseInt(modal.dataset.currentIndex || 0);
      idx = (idx - 1 + srcs.length) % srcs.length;
      modalImg.src = srcs[idx];
      modal.dataset.currentIndex = idx;
    });

    rightBtn.addEventListener('mouseenter', function () { rightBtn.style.background = 'rgba(0,0,0,0.8)'; });
    rightBtn.addEventListener('mouseleave', function () { rightBtn.style.background = 'rgba(0,0,0,0.5)'; });
    rightBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var idx = parseInt(modal.dataset.currentIndex || 0);
      idx = (idx + 1) % srcs.length;
      modalImg.src = srcs[idx];
      modal.dataset.currentIndex = idx;
    });

    // Bind each image inside the main container
    imagenes.forEach(function (img) {
      if (!img.src) return;
      img.style.cursor = 'pointer';
      img.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = srcs.indexOf(img.src);
        if (idx === -1) idx = 0;
        modalImg.src = img.src;
        modal.dataset.currentIndex = idx;
        modal.style.display = 'flex';
      });
    });

    // Keyboard navigation
    function onKeydown(e) {
      if (modal.style.display !== 'flex') return;
      if (e.key === 'Escape') cerrar();
      if (e.key === 'ArrowLeft') leftBtn.click();
      if (e.key === 'ArrowRight') rightBtn.click();
    }
    document.addEventListener('keydown', onKeydown);
  }

  /* ------------------------------------------------------------------ */
  /*  CONTENT INJECTION                                                 */
  /* ------------------------------------------------------------------ */
  function inyectarContenido(html, ruta) {
    var div = document.createElement('div');
    div.innerHTML = html;
    var pageContent = div.querySelector('#page-content');
    if (pageContent) {
      contenedor.innerHTML = pageContent.innerHTML;
    } else {
      contenedor.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-20"><p class="text-white/60 text-center">Contenido no disponible.</p></div>';
    }

    // Deduce nav highlight from the fetched path
    if (ruta.indexOf('galeria') !== -1) actualizarNav('galeria');
    else if (ruta.indexOf('videos') !== -1) actualizarNav('videos');
    else if (ruta.indexOf('relatos') !== -1) actualizarNav('relatos');
    else if (ruta.indexOf('legado') !== -1) actualizarNav('legado');
    else actualizarNav('inicio');

    contenedor.scrollIntoView({ behavior: 'smooth' });
    inicializarLightbox();
  }

  /* ------------------------------------------------------------------ */
  /*  ROUTE LOADERS                                                     */
  /* ------------------------------------------------------------------ */
  function cargarPagina(ruta) {
    if (ruta === 'archivo') {
      var archivoSection = document.getElementById('archivo');
      if (archivoSection) {
        archivoSection.scrollIntoView({ behavior: 'smooth' });
        actualizarNav('inicio');
      }
      return;
    }
    if (ruta === 'inicio') {
      contenedor.innerHTML = cachedHome;
      actualizarNav('inicio');
      contenedor.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    var mapaPaginas = {
      galeria: 'galeria.html',
      videos: 'videos.html',
      relatos: 'relatos.html',
      legado: 'legado.html'
    };
    var archivo = mapaPaginas[ruta];
    if (!archivo) return;

    fetch(archivo)
      .then(function (res) { if (!res.ok) throw new Error(); return res.text(); })
      .then(function (html) { inyectarContenido(html, ruta); })
      .catch(function () {
        contenedor.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-20"><p class="text-white/60 text-center">Error al cargar la página.</p></div>';
      });
  }

  function cargarPaginaPorHref(href) {
    // Normalise relative paths: remove leading ../ and ./
    var url = href;
    while (url.indexOf('../') === 0) url = url.substring(3);
    if (url.indexOf('./') === 0) url = url.substring(2);

    // Linking to index.html or empty — restore the home content
    if (url === 'index.html' || url === '') {
      contenedor.innerHTML = cachedHome;
      actualizarNav('inicio');
      contenedor.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    fetch(url)
      .then(function (res) { if (!res.ok) throw new Error(); return res.text(); })
      .then(function (html) { inyectarContenido(html, url); })
      .catch(function () {
        contenedor.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-20"><p class="text-white/60 text-center">Error al cargar la página.</p></div>';
      });
  }

  /* ------------------------------------------------------------------ */
  /*  GLOBAL CLICK INTERCEPTOR — catches EVERY internal <a>             */
  /* ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href) return;

    // Let external / anchor-only / email links pass through
    if (href.indexOf('http') === 0 || href.indexOf('#') === 0 || href.indexOf('mailto:') === 0) return;

    e.preventDefault();

    var ruta = link.getAttribute('data-ruta');
    if (ruta) {
      cargarPagina(ruta);
    } else {
      cargarPaginaPorHref(href);
    }
  });

  /* ------------------------------------------------------------------ */
  /*  BROWSER BACK / FORWARD                                            */
  /* ------------------------------------------------------------------ */
  window.addEventListener('popstate', function () {
    contenedor.innerHTML = cachedHome;
    actualizarNav('inicio');
  });

  /* ------------------------------------------------------------------ */
  /*  MOBILE MENU                                                       */
  /* ------------------------------------------------------------------ */
  var menuToggle = document.getElementById('menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('hidden');
    });
  }

  /* ------------------------------------------------------------------ */
  /*  INIT LIGHTBOX ON FIRST LOAD                                       */
  /* ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', inicializarLightbox);

  /* ------------------------------------------------------------------ */
  /*  UPLOAD FORM (unchanged)                                           */
  /* ------------------------------------------------------------------ */
  var formArchivo = document.getElementById('form-archivo');
  if (formArchivo) {
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
        var validTypes = ['image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav', 'video/mp4'];
        if (validTypes.indexOf(file.type) === -1) {
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
      var formData = new FormData(formArchivo);

      btn.textContent = 'Enviando…';
      btn.disabled = true;
      messages.classList.add('hidden');

      fetch('https://elarcamemoriaviva-backend.vercel.app/api/subir', {
        method: 'POST',
        body: formData
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Error del servidor');
          return res.json();
        })
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
  }
})();
