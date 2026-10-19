'use strict';

// Source text stays in the HTML/data; catalogs supply reviewed display translations.
// Update text nodes rather than rebuilding DOM so playback, tabs and focus survive.
(() => {
  const languages = ['ko', 'en', 'ja'];
  const storageKey = 'portfolio-language';
  const catalog = Object.assign({}, ...(window.portfolioCatalogs || []));
  const sources = new WeakMap();
  const attributes = new WeakMap();
  const translatedAttributes = ['aria-label', 'alt', 'title', 'placeholder', 'content'];
  const ignore = 'script, style, noscript, [translate="no"], [data-language-picker]';
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const keys = Object.keys(catalog).sort((a, b) => b.length - a.length);
  const phrases = keys.length ? new RegExp(keys.map(escape).join('|'), 'g') : null;
  let language = 'ko';
  let observer;
  let languageButton;
  let languageMenu;

  function readPreference() {
    const query = new URL(location.href).searchParams.get('lang');
    if (languages.includes(query)) return query;
    // Embedded diagrams follow the portfolio, including when storage is unavailable.
    try {
      if (window.parent !== window && languages.includes(window.parent.portfolioI18n?.language)) {
        return window.parent.portfolioI18n.language;
      }
    } catch { /* A standalone or cross-origin viewer uses its own preference. */ }
    try {
      const saved = localStorage.getItem(storageKey);
      if (languages.includes(saved)) return saved;
    } catch { /* Private browsing can deny storage. Language selection still works. */ }
    return 'en';
  }

  function translate(text) {
    if (language === 'ko') return text;
    const trimmed = text.trim();
    const column = language === 'en' ? 0 : 1;
    if (Object.hasOwn(catalog, trimmed)) return text.replace(trimmed, () => catalog[trimmed][column]);
    if (!phrases || !/[가-힣]/.test(text)) return text;
    // Composed labels (IDs, durations and captions) retain their original values.
    return text.replace(phrases, key => catalog[key][column]);
  }

  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.parentElement || node.parentElement.closest(ignore)) return;
      const previous = sources.get(node);
      const source = previous && previous.rendered === node.data ? previous.source : node.data;
      const rendered = translate(source);
      if (node.data !== rendered) node.data = rendered;
      sources.set(node, { source, rendered });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.matches(ignore)) return;
    if (node.closest(ignore)) return;
    const saved = attributes.get(node) || {};
    for (const name of translatedAttributes) {
      if (!node.hasAttribute(name)) continue;
      if (name === 'content' && !node.matches('meta[name="description"]')) continue;
      const current = node.getAttribute(name);
      const previous = saved[name];
      const source = previous && previous.rendered === current ? previous.source : current;
      const rendered = translate(source);
      if (current !== rendered) node.setAttribute(name, rendered);
      saved[name] = { source, rendered };
    }
    attributes.set(node, saved);
    for (const child of node.childNodes) translateNode(child);
  }

  function observe() {
    observer.observe(document.documentElement, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: translatedAttributes,
    });
  }

  function process(records) {
    observer.disconnect();
    for (const record of records) {
      if (record.type === 'childList') {
        for (const node of record.addedNodes) if (node.isConnected) translateNode(node);
      } else if (record.target.isConnected) translateNode(record.target);
    }
    observe();
  }

  function syncLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
      const raw = link.getAttribute('href');
      if (!raw || raw.startsWith('#') || link.hasAttribute('download')) return;
      const url = new URL(raw, location.href);
      if (url.origin !== location.origin || !url.pathname.endsWith('.html')) return;
      url.searchParams.set('lang', language);
      link.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
    });
  }

  function setLanguage(next, { persist = true } = {}) {
    if (!languages.includes(next)) return;
    process(observer.takeRecords());
    observer.disconnect();
    language = next;
    document.documentElement.lang = language;
    translateNode(document.documentElement);
    if (languageButton) {
      const label = { ko: '언어 변경 (현재: 한국어)', en: 'Change language (current: English)', ja: '言語を変更（現在：日本語）' }[language];
      languageButton.setAttribute('aria-label', label);
      languageButton.title = label;
      languageMenu.setAttribute('aria-label', { ko: '언어 선택', en: 'Choose a language', ja: '言語を選択' }[language]);
      languageMenu.querySelectorAll('[data-language]').forEach(button => {
        button.setAttribute('aria-checked', String(button.dataset.language === language));
      });
    }
    if (persist) {
      try { localStorage.setItem(storageKey, language); } catch { /* Optional persistence. */ }
    }
    const url = new URL(location.href);
    url.searchParams.set('lang', language);
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
    syncLinks();
    document.querySelectorAll('iframe').forEach(frame => {
      try { frame.contentWindow.portfolioI18n?.setLanguage(language, { persist: false }); } catch { /* Only our same-origin diagram participates. */ }
    });
    observe();
    window.dispatchEvent(new CustomEvent('portfolio:languagechange', { detail: { language } }));
  }

  function sourceText(element) {
    return [...element.childNodes].map(node => node.nodeType === Node.TEXT_NODE
      ? sources.get(node)?.source ?? node.data : sourceText(node)).join('');
  }

  function sourceAttribute(element, name) {
    const current = element.getAttribute(name);
    const previous = attributes.get(element)?.[name];
    return previous?.rendered === current ? previous.source : current;
  }

  observer = new MutationObserver(process);
  const host = document.querySelector('[data-language-host]');
  if (host) {
    const control = document.createElement('div');
    control.className = 'language-picker';
    control.dataset.languagePicker = '';
    control.translate = false;
    languageButton = document.createElement('button');
    languageButton.type = 'button';
    languageButton.id = 'portfolio-language';
    languageButton.className = 'language-trigger';
    languageButton.setAttribute('aria-haspopup', 'menu');
    languageButton.setAttribute('aria-expanded', 'false');
    languageButton.setAttribute('aria-controls', 'language-menu');
    const svgNamespace = 'http://www.w3.org/2000/svg';
    const globe = document.createElementNS(svgNamespace, 'svg');
    for (const [name, value] of Object.entries({ viewBox: '0 0 24 24', width: '21', height: '21', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'aria-hidden': 'true', focusable: 'false' })) globe.setAttribute(name, value);
    for (const [tag, values] of [['circle', { cx: 12, cy: 12, r: 9 }], ['ellipse', { cx: 12, cy: 12, rx: 4, ry: 9 }], ['path', { d: 'M3 12h18' }]]) {
      const shape = document.createElementNS(svgNamespace, tag);
      for (const [name, value] of Object.entries(values)) shape.setAttribute(name, value);
      globe.append(shape);
    }
    languageButton.append(globe);
    languageMenu = document.createElement('div');
    languageMenu.id = 'language-menu';
    languageMenu.className = 'language-menu';
    languageMenu.setAttribute('role', 'menu');
    languageMenu.hidden = true;
    for (const [value, text] of [['en', 'English'], ['ko', '한국어'], ['ja', '日本語']]) {
      const option = document.createElement('button');
      option.type = 'button'; option.lang = value; option.dataset.language = value;
      option.setAttribute('role', 'menuitemradio');
      option.tabIndex = -1;
      const name = document.createElement('span');
      name.textContent = text;
      const check = document.createElement('span');
      check.className = 'language-check'; check.textContent = '✓'; check.setAttribute('aria-hidden', 'true');
      option.append(name, check);
      option.addEventListener('click', () => { setLanguage(value); toggleMenu(false, true); });
      languageMenu.append(option);
    }
    function toggleMenu(open, restoreFocus = false) {
      languageMenu.hidden = !open;
      languageButton.setAttribute('aria-expanded', String(open));
      if (open) languageMenu.querySelector('[aria-checked="true"]').focus();
      else if (restoreFocus) languageButton.focus({ preventScroll: true });
    }
    languageButton.addEventListener('click', () => toggleMenu(languageMenu.hidden));
    languageButton.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      toggleMenu(true);
      if (event.key === 'ArrowUp') languageMenu.lastElementChild.focus();
    });
    control.addEventListener('keydown', event => {
      if (languageMenu.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation(); toggleMenu(false, true);
      } else if (event.key === 'Tab') {
        toggleMenu(false, true);
      } else if (languageMenu.contains(event.target) && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const options = [...languageMenu.children];
        const index = options.indexOf(document.activeElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
        options[next].focus();
      }
    });
    document.addEventListener('click', event => { if (!control.contains(event.target)) toggleMenu(false); });
    document.addEventListener('focusin', event => { if (!control.contains(event.target)) toggleMenu(false); });
    // Pointer/focus events inside an iframe do not bubble to this document.
    window.addEventListener('blur', () => {
      if (languageMenu.hidden) return;
      setTimeout(() => { if (document.activeElement?.tagName === 'IFRAME') toggleMenu(false); }, 0);
    });
    control.append(languageButton, languageMenu);
    host.prepend(control);
  }
  window.portfolioI18n = { setLanguage, translate, sourceText, sourceAttribute, get language() { return language; } };
  window.addEventListener('popstate', () => setLanguage(readPreference(), { persist: false }));
  window.addEventListener('storage', event => {
    if (event.key === storageKey && languages.includes(event.newValue)) setLanguage(event.newValue, { persist: false });
  });
  // A diagram may be lazy-loaded after the parent changed language.
  document.querySelectorAll('iframe').forEach(frame => frame.addEventListener('load', () => {
    try { frame.contentWindow.portfolioI18n?.setLanguage(language, { persist: false }); } catch { /* External frame. */ }
  }));
  setLanguage(readPreference(), { persist: false });
})();
