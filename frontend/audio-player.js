(function () {
  'use strict';

  var canciones = [
    '/musica/galeria.mp3', '/musica/galeria2.mp3', '/musica/galeria3.mp3',
    '/musica/index.mp3', '/musica/index2.mp3', '/musica/index3.mp3',
    '/musica/legado.mp3', '/musica/legado2.mp3', '/musica/legado3.mp3',
    '/musica/relatos.mp3', '/musica/relatos2.mp3', '/musica/relatos3.mp3'
  ];

  var btn = document.getElementById('audio-play-btn');
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

  function iconoPausa() {
    return '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  }
  function iconoPlay() {
    return '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>';
  }

  function modoPlay() {
    btn.classList.add('playing');
    btn.innerHTML = iconoPausa();
    if (tooltip) tooltip.innerHTML = 'Reproduciendo<br>Haz clic para pausar';
  }
  function modoPausa() {
    btn.classList.remove('playing');
    btn.innerHTML = iconoPlay();
    if (tooltip) tooltip.innerHTML = 'Para hacer más increíble<br>tu experiencia - Play';
  }

  if (musicaIniciada) {
    modoPlay();
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
        .then(function () {
          localStorage.setItem('musicaIniciada', 'true');
          modoPlay();
        })
        .catch(function (err) {
          console.error('Error al reproducir:', err);
          modoPausa();
        });

      currentAudio.addEventListener('timeupdate', function () {
        localStorage.setItem('audioTime', currentAudio.currentTime);
        localStorage.setItem('audioTrack', currentTrackIndex);
      });

      currentAudio.addEventListener('ended', function () {
        currentTrackIndex = Math.floor(Math.random() * canciones.length);
        currentAudio.src = canciones[currentTrackIndex];
        currentAudio.play().catch(function (e) { console.log(e); });
        localStorage.setItem('audioTrack', currentTrackIndex);
      });
    } else {
      if (currentAudio.paused) {
        currentAudio.play()
          .then(function () { modoPlay(); localStorage.setItem('musicaIniciada', 'true'); })
          .catch(function (err) { console.error('Error:', err); });
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
})();
