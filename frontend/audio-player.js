(function () {
  'use strict';

  var API_BASE = window.API_BASE || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3000' : '');

  var LOCAL_FALLBACK = [
    { id: 'local-1', titulo: 'Radio Libre', artista: 'El Arca', url_mp3: '/musica/index.mp3' },
    { id: 'local-2', titulo: 'Radio Libre 2', artista: 'El Arca', url_mp3: '/musica/index2.mp3' },
    { id: 'local-3', titulo: 'Radio Libre 3', artista: 'El Arca', url_mp3: '/musica/index3.mp3' },
    { id: 'local-4', titulo: 'Galería', artista: 'El Arca', url_mp3: '/musica/galeria.mp3' },
    { id: 'local-5', titulo: 'Galería 2', artista: 'El Arca', url_mp3: '/musica/galeria2.mp3' },
    { id: 'local-6', titulo: 'Galería 3', artista: 'El Arca', url_mp3: '/musica/galeria3.mp3' },
    { id: 'local-7', titulo: 'Legado', artista: 'El Arca', url_mp3: '/musica/legado.mp3' },
    { id: 'local-8', titulo: 'Legado 2', artista: 'El Arca', url_mp3: '/musica/legado2.mp3' },
    { id: 'local-9', titulo: 'Legado 3', artista: 'El Arca', url_mp3: '/musica/legado3.mp3' },
    { id: 'local-10', titulo: 'Relatos', artista: 'El Arca', url_mp3: '/musica/relatos.mp3' },
    { id: 'local-11', titulo: 'Relatos 2', artista: 'El Arca', url_mp3: '/musica/relatos2.mp3' },
    { id: 'local-12', titulo: 'Relatos 3', artista: 'El Arca', url_mp3: '/musica/relatos3.mp3' }
  ];

  var canciones = [];
  var currentAudio = null;
  var currentTrackIndex = -1;
  var isPlaying = false;
  var playerInited = false;

  // ─── Estado persistente (sessionStorage + localStorage fallback) ───
  var savedPlaying = sessionStorage.getItem('arca_playing') === 'true' || localStorage.getItem('arca_playing') === 'true';
  var savedTrack = parseInt(sessionStorage.getItem('arca_track') || localStorage.getItem('arca_track') || '-1', 10);
  var savedTime = parseFloat(sessionStorage.getItem('arca_time') || localStorage.getItem('arca_time') || '0');

  // ─── Referencias DOM ───
  var navPlayer = document.getElementById('nav-player');
  var nav = document.querySelector('nav');
  var btnPlay, btnPrev, btnNext, trackInfo;
  var audioElementId = 'arca-hidden-audio';

  // ─── Cargar canciones ───
  function ensureCanciones() {
    if (canciones.length === 0) {
      canciones = LOCAL_FALLBACK.slice();
    }
  }

  function cargarCanciones() {
    ensureCanciones();
    if (!playerInited) initPlayer();
    fetch(API_BASE + '/api/musica')
      .then(function (r) {
        if (!r.ok) throw new Error('Error ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (Array.isArray(data) && data.length > 0) {
          canciones = data;
          try { localStorage.setItem('arca_canciones', JSON.stringify(data)); } catch (e) {}
        } else {
          ensureCanciones();
        }
        if (savedPlaying) reanudar();
      })
      .catch(function () {
        ensureCanciones();
        if (savedPlaying) reanudar();
      });
  }

  // ─── Inicializar UI en navbar ───
  function initPlayer() {
    if (playerInited) return;
    playerInited = true;
    ensureCanciones();

    if (!navPlayer) {
      var container = document.createElement('div');
      container.id = 'nav-player';
      container.className = 'flex items-center gap-1 md:gap-2 mx-1 md:mx-3';
      var logo = nav ? nav.querySelector('a[href*="index"]') || nav.querySelector('.font-title') : null;
      var navLinks = nav ? nav.querySelector('.hidden.md\\:flex') : null;
      if (logo && navLinks && logo.parentNode) {
        logo.parentNode.insertBefore(container, navLinks);
      } else if (nav) {
        var firstChild = nav.querySelector('.max-w-6xl > div');
        if (firstChild) firstChild.appendChild(container);
      }
    }

    navPlayer = document.getElementById('nav-player');
    if (!navPlayer) return;

    var html =
      '<button id="arca-btn-prev" class="text-white/50 hover:text-mir transition text-sm md:text-base p-1 cursor-pointer" title="Canción anterior">⏮</button>' +
      '<button id="arca-btn-play" class="text-white hover:text-mir transition text-base md:text-lg p-1 cursor-pointer" title="Reproducir / Pausar">▶</button>' +
      '<button id="arca-btn-next" class="text-white/50 hover:text-mir transition text-sm md:text-base p-1 cursor-pointer" title="Siguiente canción">⏭</button>' +
      '<span id="arca-track-info" class="text-white/30 text-[9px] md:text-[10px] truncate max-w-[100px] md:max-w-[140px] hidden md:inline arca-heartbeat">Mejora tu Experiencia — PLAY</span>';
    navPlayer.innerHTML = html;

    btnPrev = document.getElementById('arca-btn-prev');
    btnPlay = document.getElementById('arca-btn-play');
    btnNext = document.getElementById('arca-btn-next');
    trackInfo = document.getElementById('arca-track-info');
    if (!document.getElementById('arca-heartbeat-style')) {
      var style = document.createElement('style');
      style.id = 'arca-heartbeat-style';
      style.textContent = '@keyframes arcaHeartbeat { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} } .arca-heartbeat{animation:arcaHeartbeat 2s ease-in-out infinite;display:inline-block} #arca-track-info{color:#ffffff;font-weight:800;text-shadow:0 0 10px #ff0000,0 0 20px #ff0000;letter-spacing:1px}';
      document.head.appendChild(style);
    }

    if (!btnPlay) return;
    attachEvents();
    maybeRestoreAudio();
  }

  // ─── Audio element persistente ───
  function getAudio() {
    if (!currentAudio) {
      currentAudio = document.getElementById(audioElementId);
      if (!currentAudio) {
        currentAudio = document.createElement('audio');
        currentAudio.id = audioElementId;
        currentAudio.preload = 'auto';
        currentAudio.volume = 0.5;
        document.body.appendChild(currentAudio);
      }
    }
    return currentAudio;
  }

  function maybeRestoreAudio() {
    if (!savedPlaying) return;
    ensureCanciones();
    if (canciones.length === 0) return;
    var idx = savedTrack >= 0 && savedTrack < canciones.length ? savedTrack : 0;
    currentTrackIndex = idx;
    var audio = getAudio();
    audio.src = canciones[idx].url_mp3;
    if (savedTime > 0 && savedTime < 3600) audio.currentTime = savedTime;
    audio.play().then(function () {
      isPlaying = true;
      updateUI();
      localStorage.setItem('arca_playing', 'true');
    }).catch(function () {
      isPlaying = false;
      updateUI();
    });
  }

  // ─── Eventos ───
  function attachEvents() {
    btnPlay.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePlay();
    });
    btnPrev.addEventListener('click', function (e) {
      e.stopPropagation();
      prevTrack();
    });
    btnNext.addEventListener('click', function (e) {
      e.stopPropagation();
      nextTrack();
    });
  }

  function togglePlay() {
    ensureCanciones();
    if (canciones.length === 0) return;
    var audio = getAudio();
    if (!audio.src || audio.src === window.location.href || audio.ended) {
      if (currentTrackIndex < 0 || currentTrackIndex >= canciones.length) {
        currentTrackIndex = Math.floor(Math.random() * canciones.length);
      }
      audio.src = canciones[currentTrackIndex].url_mp3;
    }
    if (audio.paused) {
      audio.play().then(function () {
        isPlaying = true;
        updateUI();
        localStorage.setItem('arca_playing', 'true');
      }).catch(function () {
        isPlaying = false;
        updateUI();
      });
    } else {
      audio.pause();
      isPlaying = false;
      updateUI();
      localStorage.setItem('arca_playing', 'false');
    }
  }

  function nextTrack() {
    ensureCanciones();
    if (canciones.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % canciones.length;
    playIndex(currentTrackIndex);
  }

  function prevTrack() {
    ensureCanciones();
    if (canciones.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + canciones.length) % canciones.length;
    playIndex(currentTrackIndex);
  }

  function playIndex(idx) {
    if (idx < 0 || idx >= canciones.length) return;
    currentTrackIndex = idx;
    var audio = getAudio();
    audio.src = canciones[idx].url_mp3;
    audio.currentTime = 0;
    audio.play().then(function () {
      isPlaying = true;
      updateUI();
      localStorage.setItem('arca_playing', 'true');
    }).catch(function () {
      isPlaying = false;
      updateUI();
    });
  }

  function reanudar() {
    ensureCanciones();
    if (canciones.length === 0) return;
    var idx = savedTrack >= 0 && savedTrack < canciones.length ? savedTrack : 0;
    currentTrackIndex = idx;
    var audio = getAudio();
    audio.src = canciones[idx].url_mp3;
    if (savedTime > 0 && savedTime < 3600) audio.currentTime = savedTime;
    audio.play().then(function () {
      isPlaying = true;
      updateUI();
    }).catch(function () {});
  }

  // ─── UI Update ───
  function updateUI() {
    if (btnPlay) {
      btnPlay.textContent = isPlaying ? '⏸' : '▶';
    }
    if (trackInfo) {
      trackInfo.textContent = 'Mejora tu Experiencia — PLAY';
    }
  }

  function guardarEstado() {
    if (!currentAudio) return;
    var t = currentAudio.currentTime;
    if (isFinite(t)) {
      sessionStorage.setItem('arca_time', t);
      sessionStorage.setItem('arca_track', currentTrackIndex);
      sessionStorage.setItem('arca_playing', isPlaying ? 'true' : 'false');
      localStorage.setItem('arca_time', t);
      localStorage.setItem('arca_track', currentTrackIndex);
      localStorage.setItem('arca_playing', isPlaying ? 'true' : 'false');
    }
  }

  // ─── Persistencia ───
  function setupPersistencia() {
    var audio = getAudio();
    audio.addEventListener('timeupdate', function () {
      guardarEstado();
    });
    audio.addEventListener('ended', function () {
      ensureCanciones();
      if (canciones.length > 0) {
        currentTrackIndex = (currentTrackIndex + 1) % canciones.length;
        audio.src = canciones[currentTrackIndex].url_mp3;
        audio.play().then(function () {
          isPlaying = true;
          updateUI();
          localStorage.setItem('arca_track', currentTrackIndex);
        }).catch(function () {
          isPlaying = false;
          updateUI();
        });
      }
    });
    audio.addEventListener('play', function () {
      isPlaying = true;
      updateUI();
      guardarEstado();
    });
    audio.addEventListener('pause', function () {
      if (audio.ended) {
        isPlaying = false;
        updateUI();
      }
      guardarEstado();
    });
    audio.addEventListener('error', function () {
      ensureCanciones();
      if (canciones.length > 1) {
        setTimeout(function () { nextTrack(); }, 3000);
      }
    });
  }

  window.addEventListener('beforeunload', function () {
    guardarEstado();
  });

  window.__arcaPlayer = {
    toggle: togglePlay,
    next: nextTrack,
    prev: prevTrack,
    canciones: function () { return canciones; }
  };

  setupPersistencia();
  cargarCanciones();
})();
