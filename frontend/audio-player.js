(function () {
  'use strict';

  var S = {};
  S.song = 'arca_song_idx';
  S.time = 'arca_time';
  S.playing = 'arca_playing';
  S.order = 'arca_order';
  S.pos = 'arca_pos';

  var allSongs = [
    './musica/galeria.mp3', './musica/galeria2.mp3', './musica/galeria3.mp3',
    './musica/index.mp3', './musica/index2.mp3', './musica/index3.mp3',
    './musica/legado.mp3', './musica/legado2.mp3', './musica/legado3.mp3',
    './musica/relatos.mp3', './musica/relatos2.mp3', './musica/relatos3.mp3'
  ];

  function shuffleIndex() {
    var a = [];
    for (var i = 0; i < allSongs.length; i++) a.push(i);
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  var playOrder = JSON.parse(sessionStorage.getItem(S.order));
  if (!playOrder || playOrder.length !== allSongs.length) {
    playOrder = shuffleIndex();
    sessionStorage.setItem(S.order, JSON.stringify(playOrder));
  }

  var currentIdx = parseInt(sessionStorage.getItem(S.song)) || 0;
  if (currentIdx >= playOrder.length) currentIdx = 0;

  var audio = new Audio();
  audio.preload = 'auto';
  audio.src = allSongs[playOrder[currentIdx]];
  audio.volume = 0.7;

  var savedTime = parseFloat(sessionStorage.getItem(S.time)) || 0;
  if (savedTime > 0) {
    audio.addEventListener('loadedmetadata', function onMeta() {
      audio.removeEventListener('loadedmetadata', onMeta);
      if (savedTime < audio.duration) audio.currentTime = savedTime;
    });
  }

  var savedPlaying = sessionStorage.getItem(S.playing) === 'true';
  var isPlaying = false;
  var audioUnlocked = false;

  function persist() {
    try {
      sessionStorage.setItem(S.song, String(currentIdx));
      sessionStorage.setItem(S.time, String(audio.currentTime || 0));
      sessionStorage.setItem(S.playing, isPlaying ? 'true' : 'false');
      sessionStorage.setItem(S.order, JSON.stringify(playOrder));
    } catch (e) {}
  }

  function nextRandom() {
    currentIdx = (currentIdx + 1) % playOrder.length;
    if (currentIdx === 0) {
      playOrder = shuffleIndex();
      sessionStorage.setItem(S.order, JSON.stringify(playOrder));
    }
    audio.src = allSongs[playOrder[currentIdx]];
    audio.play().catch(function () {});
    persist();
  }

  audio.addEventListener('ended', nextRandom);
  audio.addEventListener('error', function () {
    setTimeout(nextRandom, 2000);
  });

  window.addEventListener('beforeunload', persist);

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('pointerdown', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
    audio.play().then(function () {
      if (savedPlaying) {
        isPlaying = true;
        updateUI();
        persist();
      } else {
        audio.pause();
        updateUI();
      }
    }).catch(function () {
      updateUI();
    });
  }

  document.addEventListener('click', unlockAudio);
  document.addEventListener('pointerdown', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
  document.addEventListener('keydown', unlockAudio);

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
    if (!audioUnlocked) {
      unlockAudio();
      return;
    }
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
    } else {
      audio.play().then(function () {
        isPlaying = true;
        updateUI();
        persist();
      }).catch(function () {
        updateUI();
      });
    }
    updateUI();
    persist();
  }

  btn.addEventListener('click', togglePlay);
  updateUI();
  document.body.appendChild(wrapper);
})();
