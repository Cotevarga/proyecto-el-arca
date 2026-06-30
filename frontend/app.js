(function () {
  'use strict';

  var menuToggle = document.getElementById('menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('hidden');
    });
    mobileMenu.querySelectorAll('a').forEach(function (l) {
      l.addEventListener('click', function () {
        mobileMenu.classList.add('hidden');
      });
    });
  }
})();
