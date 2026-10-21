(function (root, factory) {
  const playlist = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = playlist;
  } else {
    root.ArcaPlaylist = playlist;
  }
})(globalThis, function () {
  function nextIndex(currentIndex, length) {
    if (length <= 0) return -1;
    return (currentIndex + 1 + length) % length;
  }

  function previousIndex(currentIndex, length) {
    if (length <= 0) return -1;
    return (currentIndex - 1 + length) % length;
  }

  return { nextIndex, previousIndex };
});
