/* Shared, nonclinical page interactions. */
(function () {
  'use strict';
  document.querySelectorAll('.print-page').forEach(function (button) {
    button.addEventListener('click', function () { window.print(); });
  });
  const menu = document.querySelector('.nav__links');
  const button = document.querySelector('.nav__hamburger');
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && menu && button && menu.classList.contains('open')) {
      menu.classList.remove('open'); button.classList.remove('open');
      button.setAttribute('aria-expanded', 'false'); button.focus();
    }
  });
})();
