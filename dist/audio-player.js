(function () {
  'use strict';

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

  // ─── Esperar a que Supabase esté listo ───
  function waitForSupabase(maxRetries) {
    if (maxRetries === undefined) maxRetries = 50;
    return new Promise(function (resolve) {
      var retries = 0;
      function check() {
        var s = window.miSupabase || window._supabase;
        if (s) { resolve(s); return; }
        retries++;
        if (retries >= maxRetries) { resolve(null); return; }
        setTimeout(check, 200);
      }
      check();
    });
  }

  // ─── Consulta dinámica desde Supabase ───
  async function cargarPlaylistDesdeBD() {
    var s = await waitForSupabase();
    if (!s) { console.warn('[Player] Supabase no disponible'); return []; }
    var { data, error } = await s
      .from('musica_reproductor')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });
    if (error) {
      console.warn('[Player] Error al cargar playlist:', error.message);
      setTimeout(function () { cargarPlaylistDesdeBD(); }, 5000);
      return [];
    }
    var prevLen = canciones.length;
    canciones = data || [];
    if (canciones.length > 0 && prevLen === 0 && isPlaying === false && savedPlaying === false) {
      playRandom();
    }
    return canciones;
  }

  function obtenerCancionAleatoria(lista) {
    if (!lista || lista.length === 0) return null;
    return lista[Math.floor(Math.random() * lista.length)];
  }

  function playCancion(cancion) {
    if (!cancion) return;
    var audio = getAudio();
    audio.src = cancion.url_mp3;
    audio.currentTime = 0;
    currentTrackIndex = canciones.indexOf(cancion);
    audio.play().then(function () {
      isPlaying = true;
      updateUI(cancion);
      localStorage.setItem('arca_playing', 'true');
    }).catch(function () {
      isPlaying = false;
      updateUI();
    });
  }

  function playRandom() {
    var cancion = obtenerCancionAleatoria(canciones);
    if (cancion) playCancion(cancion);
  }

  // ─── Inicialización: carga desde BD, luego restaura o arranca ───
  async function inicializar() {
    initPlayer();
    await cargarPlaylistDesdeBD();
    if (savedPlaying && canciones.length > 0) {
      var idx = savedTrack >= 0 && savedTrack < canciones.length ? savedTrack : -1;
      if (idx >= 0) {
        currentTrackIndex = idx;
        var audio = getAudio();
        audio.src = canciones[idx].url_mp3;
        if (savedTime > 0 && savedTime < 3600) audio.currentTime = savedTime;
        audio.play().then(function () {
          isPlaying = true;
          updateUI(canciones[idx]);
        }).catch(function () {});
      } else {
        playRandom();
      }
    }
  }

  // ─── Inicializar UI en navbar ───
  function initPlayer() {
    if (playerInited) return;
    playerInited = true;

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
      '<button id="arca-btn-prev" class="text-white/50 hover:text-mir transition text-sm md:text-base p-1 cursor-pointer" title="Anterior">⏮</button>' +
      '<button id="arca-btn-play" class="text-white hover:text-mir transition text-base md:text-lg p-1 cursor-pointer" title="Reproducir / Pausar">▶</button>' +
      '<button id="arca-btn-next" class="text-white/50 hover:text-mir transition text-sm md:text-base p-1 cursor-pointer" title="Siguiente">⏭</button>' +
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
    if (canciones.length === 0) {
      cargarPlaylistDesdeBD();
      return;
    }
    var audio = getAudio();
    if (!audio.src || audio.src === window.location.href || audio.ended) {
      playRandom();
      return;
    }
    if (audio.paused) {
      audio.play().then(function () {
        isPlaying = true;
        updateUI(canciones[currentTrackIndex]);
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
    if (canciones.length === 0) {
      cargarPlaylistDesdeBD();
      return;
    }
    playRandom();
  }

  function prevTrack() {
    if (canciones.length === 0) {
      cargarPlaylistDesdeBD();
      return;
    }
    currentTrackIndex = (currentTrackIndex - 1 + canciones.length) % canciones.length;
    playCancion(canciones[currentTrackIndex]);
  }

  // ─── UI Update ───
  function updateUI(cancion) {
    if (btnPlay) {
      btnPlay.textContent = isPlaying ? '⏸' : '▶';
    }
    if (trackInfo) {
      trackInfo.textContent = cancion ? (cancion.titulo + ' — ' + (cancion.artista || 'El Arca')) : 'Mejora tu Experiencia — PLAY';
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
    audio.addEventListener('ended', async function () {
      await cargarPlaylistDesdeBD();
      if (canciones.length > 0) {
        playRandom();
      }
    });
    audio.addEventListener('play', function () {
      isPlaying = true;
      updateUI(canciones[currentTrackIndex]);
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
  inicializar();
})();
