(function () {
  'use strict';

  var path = window.location.pathname;
  var route = 'index';
  if (path.includes('galeria')) route = 'galeria';
  else if (path.includes('videos')) route = 'videos';
  else if (path.includes('relatos')) route = 'relatos';

  var playlists = {
    index: ['musica/inicio1.mp3', 'musica/inicio2.mp3', 'musica/inicio3.mp3'],
    galeria: ['musica/galeria1.mp3', 'musica/galeria2.mp3', 'musica/galeria3.mp3'],
    legado: ['musica/legado1.mp3', 'musica/legado2.mp3', 'musica/legado3.mp3'],
    relatos: ['musica/relatos1.mp3', 'musica/relatos2.mp3', 'musica/relatos3.mp3']
  };

  var songs = playlists[route] || playlists.index;
  if (!songs || songs.length === 0) return;

  var currentIndex = 0;
  var audio = null;
  var isPlaying = false;

  var btn = document.createElement('button');
  btn.id = 'audio-play-btn';
  btn.setAttribute('aria-label', 'Reproducir música ambiental');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>';

  var tooltip = document.createElement('span');
  tooltip.id = 'audio-tooltip';
  tooltip.textContent = 'Para hacer más increíble tu experiencia, haz clic aquí (Play)';

  var wrapper = document.createElement('div');
  wrapper.id = 'audio-player-wrapper';
  wrapper.appendChild(btn);
  wrapper.appendChild(tooltip);

  var style = document.createElement('style');
  style.textContent = [
    '#audio-player-wrapper { position: fixed; top: 90px; left: 16px; z-index: 9999; display: flex; align-items: center; gap: 10px; }',
    '#audio-play-btn { width: 48px; height: 48px; border-radius: 50%; border: 2px solid #E50914; background: rgba(17,17,17,0.9); color: #E50914; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; backdrop-filter: blur(4px); box-shadow: 0 0 15px rgba(229,9,20,0.3); }',
    '#audio-play-btn:hover { background: #E50914; color: #fff; transform: scale(1.1); box-shadow: 0 0 25px rgba(229,9,20,0.6); }',
    '#audio-play-btn.playing { background: #E50914; color: #fff; }',
    '#audio-tooltip { background: rgba(17,17,17,0.92); color: rgba(255,255,255,0.9); font-family: Inter, system-ui, sans-serif; font-size: 0.75rem; padding: 8px 14px; border: 1px solid rgba(229,9,20,0.4); white-space: nowrap; backdrop-filter: blur(4px); animation: tooltipPulse 2s ease-in-out infinite; }',
    '@keyframes tooltipPulse { 0%, 100% { opacity: 0.7; transform: translateX(0); } 50% { opacity: 1; transform: translateX(4px); } }',
    '@media (max-width: 640px) { #audio-player-wrapper { top: 80px; left: 8px; } #audio-tooltip { display: none; } }'
  ].join('\n');
  document.head.appendChild(style);

  function togglePlay() {
    if (!audio) {
      audio = new Audio(songs[currentIndex]);
      audio.preload = 'auto';
      audio.addEventListener('ended', function () {
        currentIndex = (currentIndex + 1) % songs.length;
        audio.src = songs[currentIndex];
        audio.play().catch(function () {});
      });
      audio.addEventListener('error', function () {
        currentIndex = (currentIndex + 1) % songs.length;
        audio.src = songs[currentIndex];
        audio.play().catch(function () {});
      });
    }
    if (isPlaying) {
      audio.pause();
      btn.classList.remove('playing');
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>';
      tooltip.textContent = 'Música en pausa — Haz clic para reanudar';
    } else {
      audio.play().then(function () {
        btn.classList.add('playing');
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        tooltip.textContent = 'Reproduciendo — Haz clic para pausar';
      }).catch(function () {
        tooltip.textContent = 'Haz clic para reproducir (autoplay bloqueado)';
      });
    }
    isPlaying = !isPlaying;
  }

  btn.addEventListener('click', togglePlay);
  document.body.appendChild(wrapper);
})();
