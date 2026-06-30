window.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var canciones = [
    '/musica/galeria.mp3', '/musica/galeria2.mp3', '/musica/galeria3.mp3',
    '/musica/index.mp3', '/musica/index2.mp3', '/musica/index3.mp3',
    '/musica/legado.mp3', '/musica/legado2.mp3', '/musica/legado3.mp3',
    '/musica/relatos.mp3', '/musica/relatos2.mp3', '/musica/relatos3.mp3'
  ];

  var container = document.createElement('div');
  container.id = 'global-audio-container';
  container.innerHTML =
    '<div id="audio-tooltip" style="position:fixed; top:20px; right:80px; background:#111; color:white; padding:8px 12px; border-radius:4px; font-size:12px; border:1px solid #E50914; z-index:99999; text-align:right;">' +
      'Para hacer m\u00e1s incre\u00edble<br>tu experiencia - Play' +
    '</div>' +
    '<button id="btn-global-play" style="position:fixed; top:15px; right:15px; z-index:99999; background:#E50914; border:none; border-radius:50%; width:50px; height:50px; cursor:pointer; color:white; font-size:20px; display:flex; align-items:center; justify-content:center;">' +
      '\u25b6' +
    '</button>';
  document.body.appendChild(container);

  var btn = document.getElementById('btn-global-play');
  var tooltip = document.getElementById('audio-tooltip');
  if (!btn) return;

  var currentAudio = null;
  var currentTrackIndex = -1;

  var musicaIniciada = localStorage.getItem('musicaIniciada') === 'true';
  var audioTrack = parseInt(localStorage.getItem('audioTrack') || '-1');
  var audioTime = parseFloat(localStorage.getItem('audioTime') || '0');

  if (isNaN(audioTrack) || audioTrack < 0 || audioTrack >= canciones.length) {
    audioTrack = Math.floor(Math.random() * canciones.length);
  }

  function iconoPausa() { return '\u23f8'; }
  function iconoPlay() { return '\u25b6'; }

  function modoPlay() {
    btn.textContent = iconoPausa();
    btn.style.background = '#c62828';
    if (tooltip) tooltip.innerHTML = 'Reproduciendo<br>Haz clic para pausar';
  }
  function modoPausa() {
    btn.textContent = iconoPlay();
    btn.style.background = '#E50914';
    if (tooltip) tooltip.innerHTML = 'Para hacer m\u00e1s incre\u00edble<br>tu experiencia - Play';
  }

  function configurarListeners() {
    if (!currentAudio) return;
    currentAudio.addEventListener('timeupdate', function () {
      localStorage.setItem('audioTime', currentAudio.currentTime);
      localStorage.setItem('audioTrack', currentTrackIndex);
    });
    currentAudio.addEventListener('ended', function () {
      currentTrackIndex = Math.floor(Math.random() * canciones.length);
      currentAudio.src = canciones[currentTrackIndex];
      currentAudio.play().catch(function () {});
      localStorage.setItem('audioTrack', currentTrackIndex);
    });
  }

  if (musicaIniciada) {
    modoPlay();
    currentTrackIndex = audioTrack;
    currentAudio = new Audio(canciones[currentTrackIndex]);
    currentAudio.volume = 0.6;
    if (audioTime > 0) {
      currentAudio.currentTime = audioTime;
    }
    currentAudio.play().catch(function () {});
    configurarListeners();
  }

  btn.addEventListener('click', function () {
    if (!currentAudio) {
      currentTrackIndex = audioTrack;
      currentAudio = new Audio(canciones[currentTrackIndex]);
      currentAudio.volume = 0.6;
      if (audioTime > 0) {
        currentAudio.currentTime = audioTime;
      }
      currentAudio.play()
        .then(function () { localStorage.setItem('musicaIniciada', 'true'); modoPlay(); })
        .catch(function () { modoPausa(); });
      configurarListeners();
    } else {
      if (currentAudio.paused) {
        currentAudio.play()
          .then(function () { modoPlay(); localStorage.setItem('musicaIniciada', 'true'); })
          .catch(function () {});
      } else {
        currentAudio.pause();
        modoPausa();
        localStorage.setItem('musicaIniciada', 'false');
      }
    }
  });

  window.addEventListener('beforeunload', function () {
    if (currentAudio) {
      localStorage.setItem('audioTime', currentAudio.currentTime);
      localStorage.setItem('audioTrack', currentTrackIndex);
    }
  });
});
