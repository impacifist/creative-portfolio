'use strict';
const byId = (id) => document.getElementById(id);
const tabs = [...document.querySelectorAll('[role="tab"][data-case]')];
const dialog = byId('lightbox');
let activeCase = 'kotone';
function paragraph(text) { const p = document.createElement('p'); p.textContent = text; return p; }
function selectCase(key, focusTab = false) {
  const item = window.portfolioCases[key];
  if (!item) return;
  activeCase = key;
  tabs.forEach(tab => {
    const selected = tab.dataset.case === key;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focusTab) tab.focus();
  });
  byId('character-panel').setAttribute('aria-labelledby', `tab-${key}`);
  byId('case-name').textContent = item.name;
  byId('case-work').textContent = item.work;
  for (const type of ['reference', 'generated']) {
    const img = byId(`${type}-image`);
    img.src = item[type]; img.alt = item[`${type}Alt`];
    const size = type === 'reference' ? item.referenceSize : [1080, 1920];
    img.width = size[0]; img.height = size[1];
    byId(`${type}-button`).setAttribute('aria-label', `${item.name} ${type === 'reference' ? '참조 원본' : '생성 결과'} 크게 보기`);
  }
  byId('reference-caption').textContent = `${item.work} · ${item.name} / 원본 이미지 출처: 공식 홈페이지`;
  for (const field of ['preserved', 'variation', 'limitations']) byId(field).textContent = item[field];
  const link = document.createElement('a'); link.href = item.directSource; link.textContent = `원본 이미지 출처 · ${item.officialLabel} ↗`; link.target = '_blank'; link.rel = 'noopener noreferrer';
  byId('case-sources').replaceChildren(paragraph(item.credit), link,
    paragraph('본인의 기여: LoRA 제작 및 이미지 생성. 원작 디자인·참조 이미지는 본인의 창작 원화가 아닙니다.'));
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectCase(tab.dataset.case));
  tab.addEventListener('keydown', (event) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    selectCase(tabs[next].dataset.case, true);
  });
});
for (const type of ['reference', 'generated']) {
  byId(`${type}-button`).addEventListener('click', () => {
    const item = window.portfolioCases[activeCase];
    byId('lightbox-title').textContent = `${item.name} / ${type === 'reference' ? '참조 원본' : 'LoRA 생성 결과'}`;
    byId('lightbox-image').src = item[type]; byId('lightbox-image').alt = item[`${type}Alt`];
    byId('lightbox-credit').textContent = `${item.credit} ${type === 'reference' ? '원본 이미지 출처: 공식 홈페이지.' : '비공식 개인 AI 생성 작업.'}`;
    dialog.showModal();
  });
}
byId('close-lightbox').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
});
selectCase(activeCase);

const portfolioTabs = [...document.querySelectorAll('[data-portfolio]')];
const portfolioPanels = [...document.querySelectorAll('[data-portfolio-panel]')];
function selectPortfolio(key, { focus = false, updateUrl = false } = {}) {
  if (!portfolioPanels.some(panel => panel.id === key)) return;
  portfolioTabs.forEach(tab => {
    const selected = tab.dataset.portfolio === key;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  portfolioPanels.forEach(panel => {
    panel.hidden = panel.id !== key;
    if (panel.hidden) panel.querySelectorAll('video').forEach(video => video.pause());
  });
  if (dialog.open) dialog.close();
  if (updateUrl && location.hash !== `#${key}`) history.pushState(null, '', `#${key}`);
}
portfolioTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectPortfolio(tab.dataset.portfolio, { updateUrl: true }));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? portfolioTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + portfolioTabs.length) % portfolioTabs.length;
    selectPortfolio(portfolioTabs[next].dataset.portfolio, { focus: true, updateUrl: true });
  });
});
function routePortfolio() {
  const target = byId(location.hash.slice(1));
  const panel = target?.closest('[data-portfolio-panel]');
  selectPortfolio(panel?.id || 'video');
  if (target && panel) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}
window.addEventListener('hashchange', routePortfolio);
routePortfolio();
