'use strict';

// Motion vocabulary: Mask Wipe and Stagger Follow from TakayuStudio's reference.
// All content is visible without this enhancement; no scroll-triggered hiding.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Map();
  const ease = 'cubic-bezier(.22, 1, .36, 1)';
  function animate(element, frames, duration, delay = 0) {
    if (!element || reduced.matches || !element.animate) return;
    running.get(element)?.cancel();
    const animation = element.animate(frames, { duration, delay, easing: ease, fill: 'backwards' });
    running.set(element, animation);
    const forget = () => { if (running.get(element) === animation) running.delete(element); };
    animation.onfinish = forget;
    animation.oncancel = forget;
  }
  function reveal(panel, opening = false) {
    const title = panel.querySelector('.page-intro h1, .control-intro h1');
    const media = panel.querySelector('.video-showcase, #character-panel, .project-row:not([hidden]), .workflow-canvas-wrap');
    animate(title, [
      { clipPath: 'inset(0 0 100% 0)', transform: 'translateY(16px)' },
      { clipPath: 'inset(0 0 0 0)', transform: 'translateY(0)' },
    ], opening ? 850 : 580);
    animate(media, [
      { opacity: .25, transform: 'translateY(12px) scale(.99)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ], opening ? 900 : 500, opening ? 100 : 40);
  }

  // The selection surface follows the real tab position, including mobile rows.
  const nav = document.querySelector('.portfolio-navigation');
  const marker = document.createElement('span');
  marker.className = 'navigation-marker';
  marker.setAttribute('aria-hidden', 'true');
  marker.setAttribute('role', 'presentation');
  nav.append(marker);
  function positionMarker() {
    const selected = nav.querySelector('[aria-selected="true"]');
    if (!selected) return;
    marker.style.width = `${selected.offsetWidth}px`;
    marker.style.height = `${selected.offsetHeight}px`;
    marker.style.transform = `translate(${selected.offsetLeft}px, ${selected.offsetTop}px)`;
    nav.classList.add('has-marker');
  }
  const navObserver = new MutationObserver(positionMarker);
  navObserver.observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
  const resizeObserver = new ResizeObserver(positionMarker);
  resizeObserver.observe(nav);
  positionMarker();
  window.addEventListener('portfolio:languagechange', positionMarker);
  document.fonts.ready.then(positionMarker);

  document.querySelectorAll('.clip-stills img').forEach(img => {
    const frame = document.createElement('div');
    frame.className = 'clip-still-frame';
    img.before(frame);
    frame.append(img);
  });
  const shots = [...document.querySelectorAll('.film-shot')];
  const sceneDialog = document.querySelector('#scene-dialog');
  const notes = [
    ['잠기운은 표정으로.', '졸린 얼굴을 가까이 담고, 카메라는 고정했습니다. 큰 움직임보다 표정에 집중하는 장면입니다.'],
    ['소리가 멎는 순간.', '알람과 손의 짧은 인서트로 행동을 연결했습니다. 알람이 멎은 뒤의 정적도 장면의 일부로 두었습니다.'],
    ['기지개에는 긴 호흡을.', '기지개에는 다른 샷보다 긴 호흡을 배정했습니다. 짧은 인서트와 대비되도록 컷의 속도에 차이를 주었습니다.'],
    ['준비 과정은 손끝으로.', '머리를 정돈하는 손을 가까이 담아 준비 과정을 나눴습니다. 얼굴 전체 대신 작은 행동에 시선이 머물도록 구성했습니다.'],
    ['작은 미소를 가까이.', '입가의 클로즈업으로 작은 미소를 담았습니다. 손끝과 입가를 번갈아 보여주며 하루를 준비하는 표정을 연결했습니다.'],
    ['컷 사이에서 시간을 건너기.', '환복과 이동은 컷 사이에서 생략하도록 지시했습니다. 교복 차림의 또렷해진 표정으로 아침의 감정 변화를 마무리했습니다.'],
  ];
  let activeShot = 0;
  function selectShot(index) {
    activeShot = (index + shots.length) % shots.length;
    const shot = shots[activeShot];
    const image = shot.querySelector('img');
    const [title, copy] = notes[activeShot];
    shots.forEach((link, position) => {
      if (position === activeShot) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    document.querySelector('#scene-note-title').textContent = title;
    document.querySelector('#scene-note-copy').textContent = copy;
    const caption = shot.querySelector('.film-caption');
    document.querySelector('#scene-dialog-title').textContent = window.portfolioI18n?.sourceText(caption) || caption.textContent;
    const preview = document.querySelector('#scene-dialog-image');
    preview.src = image.src;
    preview.alt = window.portfolioI18n?.sourceAttribute(image, 'alt') || image.alt;
    document.querySelector('#scene-dialog-note').textContent = copy;
    document.querySelector('#scene-position').textContent = `${activeShot + 1} / ${shots.length}`;
  }
  shots.forEach((shot, index) => {
    shot.setAttribute('aria-haspopup', 'dialog');
    shot.setAttribute('aria-controls', sceneDialog.id);
    shot.addEventListener('click', event => {
      // Preserve ordinary links for deliberate new-tab actions and without JS.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      selectShot(index);
      document.querySelector('#school-video').pause();
      sceneDialog.showModal();
    });
  });
  function stepShot(direction) {
    selectShot(activeShot + direction);
    animate(document.querySelector('#scene-dialog-image'), [{ opacity: .5 }, { opacity: 1 }], 240);
  }
  document.querySelector('#previous-scene').addEventListener('click', () => stepShot(-1));
  document.querySelector('#next-scene').addEventListener('click', () => stepShot(1));
  document.querySelector('#close-scene').addEventListener('click', () => sceneDialog.close());
  sceneDialog.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    stepShot(event.key === 'ArrowRight' ? 1 : -1);
  });
  sceneDialog.addEventListener('click', event => {
    if (event.target !== sceneDialog) return;
    const rect = sceneDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) sceneDialog.close();
  });
  selectShot(0);
  const panelObserver = new MutationObserver(records => {
    if (sceneDialog.open && document.querySelector('#video').hidden) sceneDialog.close();
    const incoming = new Set(records.filter(record => !record.target.hidden).map(record => record.target));
    incoming.forEach(panel => {
      if (!panel.closest('[data-portfolio-panel]').hidden) {
        if (panel.matches('[data-portfolio-panel]')) reveal(panel);
        else animate(panel, [{ opacity: .4 }, { opacity: 1 }], 320);
      }
    });
    // Rapid switching must not leave animations running in hidden panels.
    for (const [element, animation] of running) {
      if (element.closest('[hidden]')) animation.cancel();
    }
  });
  document.querySelectorAll('[data-portfolio-panel], #technology .project-row').forEach(panel => {
    panelObserver.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  });
  document.querySelectorAll('details').forEach(details => {
    details.addEventListener('toggle', () => {
      if (details.open) animate(details.querySelector(':scope > :not(summary)'), [{ opacity: 0 }, { opacity: 1 }], 260);
    });
  });
  document.querySelector('#lightbox').addEventListener('toggle', event => {
    if (event.newState === 'open') animate(event.target, [
      { opacity: 0, transform: 'scale(.98)' }, { opacity: 1, transform: 'scale(1)' },
    ], 280);
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) for (const animation of running.values()) animation.cancel();
  });
  reveal(document.querySelector('[data-portfolio-panel]:not([hidden])'), true);
})();
