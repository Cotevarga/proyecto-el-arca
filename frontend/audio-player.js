(function () {
  'use strict';

  var canciones = [
    './musica/galeria.mp3', './musica/galeria2.mp3', './musica/galeria3.mp3',
    './musica/index.mp3', './musica/index2.mp3', './musica/index3.mp3',
    './musica/legado.mp3', './musica/legado2.mp3', './musica/legado3.mp3',
    './musica/relatos.mp3', './musica/relatos2.mp3', './musica/relatos3.mp3'
  ];

  var currentAudio = null;
  var currentTrackIndex = -1;

  /* ---- Leer estado guardado ---- */
  var savedState = null;
  try {
    var raw = localStorage.getItem('arcaAudio');
    if (raw) savedState = JSON.parse(raw);
  } catch (_) {}

  var estabaSonando = savedState && savedState.playing === true;
  if (savedState && (savedState.trackIndex < 0 || savedState.trackIndex >= canciones.length)) {
    savedState.trackIndex = Math.floor(Math.random() * canciones.length);
  }

  /* ---- Crear elementos DOM ---- */
  var btn = document.createElement('button');
  btn.id = 'audio-play-btn';
  btn.setAttribute('aria-label', 'Reproducir música ambiental');

  var tooltip = document.createElement('span');
  tooltip.id = 'audio-tooltip';
  tooltip.innerHTML = 'Para hacer más increíble<br>tu experiencia - Play';

  var wrapper = document.createElement('div');
  wrapper.id = 'audio-player-wrapper';
  wrapper.appendChild(btn);
  wrapper.appendChild(tooltip);

  var css = document.createElement('style');
  css.textContent = [
    '#audio-player-wrapper { position: fixed; top: 90px; right: 16px; z-index: 9999; display: flex; align-items: center; gap: 10px; flex-direction: row-reverse; }',
    '#audio-play-btn { width: 48px; height: 48px; border-radius: 50%; border: 2px solid #E50914; background: rgba(17,17,17,0.9); color: #E50914; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; backdrop-filter: blur(4px); box-shadow: 0 0 15px rgba(229,9,20,0.3); flex-shrink: 0; }',
    '#audio-play-btn:hover { background: #E50914; color: #fff; transform: scale(1.1); box-shadow: 0 0 25px rgba(229,9,20,0.6); }',
    '#audio-play-btn.playing { background: #E50914; color: #fff; }',
    '#audio-tooltip { background: rgba(17,17,17,0.92); color: rgba(255,255,255,0.9); font-family: Arial, Helvetica, sans-serif; font-size: 0.7rem; line-height: 1.4; padding: 8px 14px; border: 1px solid rgba(229,9,20,0.4); text-align: center; backdrop-filter: blur(4px); animation: tooltipBounce 1.8s ease-in-out infinite; }',
    '@keyframes tooltipBounce { 0%, 100% { opacity: 0.7; transform: translateX(0); } 50% { opacity: 1; transform: translateX(-4px); } }',
    '@media (max-width: 640px) { #audio-player-wrapper { top: 80px; right: 8px; } #audio-tooltip { display: none; } }'
  ].join('\n');
  document.head.appendChild(css);

  function iconoPausa() {
    return '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  }
  function iconoPlay() {
    return '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>';
  }

  function modoPlay() {
    btn.classList.add('playing');
    btn.innerHTML = iconoPausa();
    tooltip.innerHTML = 'Reproduciendo<br>Haz clic para pausar';
  }
  function modoPausa() {
    btn.classList.remove('playing');
    btn.innerHTML = iconoPlay();
    tooltip.innerHTML = 'Para hacer más increíble<br>tu experiencia - Play';
  }

  /* ---- Guardar estado en localStorage ---- */
  function guardarEstado() {
    if (!currentAudio) return;
    try {
      localStorage.setItem('arcaAudio', JSON.stringify({
        playing: !currentAudio.paused,
        trackIndex: currentTrackIndex,
        currentTime: currentAudio.currentTime
      }));
    } catch (_) {}
  }

  /* ---- Mostrar botón como "sonando" si antes se estaba reproduciendo ---- */
  if (estabaSonando) {
    modoPlay();
  }

  /* ---- Click del botón ---- */
  btn.addEventListener('click', function () {
    if (!currentAudio) {
      var idx = savedState ? savedState.trackIndex : Math.floor(Math.random() * canciones.length);
      if (idx < 0 || idx >= canciones.length) idx = Math.floor(Math.random() * canciones.length);
      currentTrackIndex = idx;
      currentAudio = new Audio(canciones[currentTrackIndex]);
      currentAudio.volume = 0.6;

      if (savedState && savedState.currentTime) {
        currentAudio.currentTime = savedState.currentTime;
      }

      currentAudio.play()
        .then(function () {
          console.log('Sonando:', canciones[currentTrackIndex]);
          modoPlay();
          guardarEstado();
        })
        .catch(function (err) {
          console.error('Error al reproducir:', err);
          modoPausa();
        });

      currentAudio.addEventListener('ended', function () {
        currentTrackIndex = Math.floor(Math.random() * canciones.length);
        currentAudio.src = canciones[currentTrackIndex];
        currentAudio.play().catch(function (e) { console.log(e); });
        guardarEstado();
      });
    } else {
      if (currentAudio.paused) {
        currentAudio.play()
          .then(function () { modoPlay(); guardarEstado(); })
          .catch(function (err) { console.error('Error:', err); });
      } else {
        currentAudio.pause();
        modoPausa();
        guardarEstado();
      }
    }
  });

  /* ---- Auto-guardado periódico + antes de salir ---- */
  setInterval(function () { guardarEstado(); }, 2000);
  window.addEventListener('beforeunload', guardarEstado);

  document.body.appendChild(wrapper);
})();
