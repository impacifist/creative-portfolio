'use strict';

// Native disclosures keep evidence readable without JS; shared links open ancestors.
(() => {
  function openTarget() {
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    let parent = target.parentElement;
    let opened = false;
    while (parent) {
      if (parent.matches('details') && !parent.open) { parent.open = true; opened = true; }
      parent = parent.parentElement;
    }
    if (opened) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }
  window.addEventListener('hashchange', openTarget);
  window.addEventListener('popstate', openTarget);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link?.hash === location.hash) openTarget();
  });
  openTarget();
})();
