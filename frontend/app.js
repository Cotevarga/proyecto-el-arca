(function () {
  'use strict';

  /* ==============================
     SPA ROUTER
  ============================== */

  const contenedor = document.getElementById('contenedor-principal');
  const homeHTML = contenedor.innerHTML;

  // Save a reference to the home page content (includes hero, inicios, comunicacion, mapa, archivo)
  let cachedHome = homeHTML;

  function actualizarNav (ruta) {
    document.querySelectorAll('nav a[data-ruta]').forEach(function (a) {
      const linkRuta = a.getAttribute('data-ruta');
      if (linkRuta === ruta) {
        a.classList.add('text-mir');
        a.style.borderBottomColor = '#E50914';
      } else {
        a.classList.remove('text-mir');
        a.style.borderBottomColor = 'transparent';
      }
    });
  }

  function cargarPagina (ruta) {
    // If "archivo" is clicked while on home, just scroll
    if (ruta === 'archivo') {
      const archivoSection = document.getElementById('archivo');
      if (archivoSection) {
        archivoSection.scrollIntoView({ behavior: 'smooth' });
        actualizarNav('inicio');
        return;
      }
    }

    // Home
    if (ruta === 'inicio') {
      contenedor.innerHTML = cachedHome;
      actualizarNav('inicio');
      contenedor.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Sub-pages
    const mapaPaginas = {
      galeria: 'galeria.html',
      videos: 'videos.html',
      relatos: 'relatos.html',
      legado: 'legado.html'
    };

    const archivo = mapaPaginas[ruta];
    if (!archivo) return;

    fetch(archivo)
      .then(function (res) {
        if (!res.ok) throw new Error('Error al cargar la página');
        return res.text();
      })
      .then(function (html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        const pageContent = div.querySelector('#page-content');
        if (pageContent) {
          contenedor.innerHTML = pageContent.innerHTML;
        } else {
          contenedor.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-20"><p class="text-white/60 text-center">Contenido no disponible.</p></div>';
        }
        actualizarNav(ruta);
        contenedor.scrollIntoView({ behavior: 'smooth' });

        // Re-init lightbox after content injection
        if (typeof iniciarLightbox === 'function') {
          iniciarLightbox();
        }
      })
      .catch(function (err) {
        console.error('SPA fetch error:', err);
        contenedor.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-20"><p class="text-white/60 text-center">Error al cargar la página.</p></div>';
      });
  }

  // Navbar clicks
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-ruta]');
    if (!link) return;
    e.preventDefault();
    var ruta = link.getAttribute('data-ruta');
    cargarPagina(ruta);
  });

  // Back/forward
  window.addEventListener('popstate', function () {
    contenedor.innerHTML = cachedHome;
    actualizarNav('inicio');
  });

  // Mobile menu toggle
  var menuToggle = document.getElementById('menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('hidden');
    });
  }

  /* ==============================
     LIGHTBOX MODAL
  ============================== */

  function iniciarLightbox () {
    // Remove previous lightbox if exists
    var existing = document.getElementById('lightbox-modal');
    if (existing) existing.remove();

    var galleryImages = contenedor.querySelectorAll('img[data-lightbox]');
    // Also include any img inside a section with "galeria" context (grid images)
    if (galleryImages.length === 0) {
      galleryImages = contenedor.querySelectorAll('#page-content img');
    }
    // Fallback: any img within the galeria section
    if (galleryImages.length === 0) {
      var galeriaSection = contenedor.querySelector('#galeria, [data-galeria]');
      if (galeriaSection) {
        galleryImages = galeriaSection.querySelectorAll('img');
      }
    }

    if (galleryImages.length === 0) return;

    var images = [];
    galleryImages.forEach(function (img) {
      if (img.src && img.src !== '') {
        images.push(img.src);
      }
    });

    if (images.length === 0) return;

    var currentIndex = 0;

    // Create modal
    var modal = document.createElement('div');
    modal.id = 'lightbox-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.25s ease;';

    // Close background
    modal.addEventListener('click', function (e) {
      if (e.target === modal) cerrarModal();
    });

    // Image
    var img = document.createElement('img');
    img.style.cssText = 'max-width:90vw;max-height:90vh;object-fit:contain;border-radius:4px;box-shadow:0 0 40px rgba(0,0,0,0.6);cursor:pointer;';
    img.alt = 'Galería El Arca';

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'position:absolute;top:20px;right:30px;font-size:2.5rem;color:white;background:none;border:none;cursor:pointer;z-index:10;line-height:1;';
    closeBtn.addEventListener('click', cerrarModal);

    // Left arrow
    var leftBtn = document.createElement('button');
    leftBtn.innerHTML = '&#10094;';
    leftBtn.style.cssText = 'position:absolute;left:20px;top:50%;transform:translateY(-50%);font-size:2.5rem;color:white;background:rgba(0,0,0,0.5);border:none;cursor:pointer;padding:0.5rem 0.75rem;border-radius:4px;transition:background 0.2s;z-index:10;';
    leftBtn.addEventListener('mouseenter', function () { leftBtn.style.background = 'rgba(0,0,0,0.8)'; });
    leftBtn.addEventListener('mouseleave', function () { leftBtn.style.background = 'rgba(0,0,0,0.5)'; });
    leftBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      img.src = images[currentIndex];
    });

    // Right arrow
    var rightBtn = document.createElement('button');
    rightBtn.innerHTML = '&#10095;';
    rightBtn.style.cssText = 'position:absolute;right:20px;top:50%;transform:translateY(-50%);font-size:2.5rem;color:white;background:rgba(0,0,0,0.5);border:none;cursor:pointer;padding:0.5rem 0.75rem;border-radius:4px;transition:background 0.2s;z-index:10;';
    rightBtn.addEventListener('mouseenter', function () { rightBtn.style.background = 'rgba(0,0,0,0.8)'; });
    rightBtn.addEventListener('mouseleave', function () { rightBtn.style.background = 'rgba(0,0,0,0.5)'; });
    rightBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      currentIndex = (currentIndex + 1) % images.length;
      img.src = images[currentIndex];
    });

    modal.appendChild(closeBtn);
    modal.appendChild(leftBtn);
    modal.appendChild(rightBtn);
    modal.appendChild(img);
    document.body.appendChild(modal);

    function cerrarModal () {
      modal.style.opacity = '0';
      setTimeout(function () {
        modal.remove();
      }, 250);
    }

    // Open image on click
    galleryImages.forEach(function (galleryImg, idx) {
      galleryImg.style.cursor = 'pointer';
      galleryImg.addEventListener('click', function (e) {
        e.preventDefault();
        currentIndex = idx;
        img.src = images[currentIndex];
        modal.style.opacity = '1';
      });
    });

    // Keyboard navigation
    function onKeydown (e) {
      if (!document.getElementById('lightbox-modal')) return;
      if (e.key === 'Escape') cerrarModal();
      if (e.key === 'ArrowLeft') {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        img.src = images[currentIndex];
      }
      if (e.key === 'ArrowRight') {
        currentIndex = (currentIndex + 1) % images.length;
        img.src = images[currentIndex];
      }
    }
    document.addEventListener('keydown', onKeydown);
  }

  // Expose for external calls (e.g., after content injection)
  window.iniciarLightbox = iniciarLightbox;

  // Init lightbox on load
  document.addEventListener('DOMContentLoaded', iniciarLightbox);

  /* ==============================
     UPLOAD FORM HANDLER
  ============================== */

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
        if (!validTypes.includes(file.type)) {
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
        .then(function (data) {
          messages.textContent = '¡Gracias por compartir tu recuerdo!';
          messages.className = 'text-center text-sm font-medium text-green-400';
          messages.classList.remove('hidden');
          formArchivo.reset();
          if (fileInfo) fileInfo.classList.add('hidden');
        })
        .catch(function (err) {
          console.error(err);
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
