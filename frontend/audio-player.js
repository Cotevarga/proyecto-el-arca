(function () {
  'use strict';

  var canciones = [
    './musica/galeria.mp3', './musica/galeria2.mp3', './musica/galeria3.mp3',
    './musica/index.mp3', './musica/index2.mp3', './musica/index3.mp3',
    './musica/legado.mp3', './musica/legado2.mp3', './musica/legado3.mp3',
    './musica/relatos.mp3', './musica/relatos2.mp3', './musica/relatos3.mp3'
  ];

  var audio = new Audio();
  audio.volume = 0.7;

  var isPlaying = false;
  var currentIndex = -1;

  function pickRandom() {
    var next;
    do {
      next = Math.floor(Math.random() * canciones.length);
    } while (next === currentIndex && canciones.length > 1);
    currentIndex = next;
    return canciones[currentIndex];
  }

  function playCurrent() {
    audio.play()
      .then(function () {
        isPlaying = true;
        updateUI();
        console.log("Reproduciendo con éxito:", audio.src);
      })
      .catch(function (err) {
        console.error("El navegador bloqueó la reproducción interactiva:", err);
        isPlaying = false;
        updateUI();
      });
  }

  audio.addEventListener('ended', function () {
    audio.src = pickRandom();
    playCurrent();
  });

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

  function updateUI() {
    if (isPlaying) {
      btn.classList.add('playing');
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
      tooltip.innerHTML = 'Reproduciendo<br>Haz clic para pausar';
    } else {
      btn.classList.remove('playing');
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>';
      tooltip.innerHTML = 'Para hacer más increíble<br>tu experiencia - Play';
    }
  }

  function togglePlay() {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      updateUI();
      return;
    }

    if (audio.src === '' || audio.src === window.location.href + '/' || currentIndex === -1) {
      audio.src = pickRandom();
    }

    playCurrent();
  }

  btn.addEventListener('click', togglePlay);
  updateUI();
  document.body.appendChild(wrapper);
})();
