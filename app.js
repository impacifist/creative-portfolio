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
  const project = target?.closest('.project-row');
  if (project && panel?.id === 'technology') selectTechnology(project.id);
  if (target && panel) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}
// Keep the original articles intact: without JavaScript every project remains readable.
const technologyProjects = [...document.querySelectorAll('#technology .project-row')];
const technologyNav = document.createElement('div');
technologyNav.className = 'technology-nav';
technologyNav.setAttribute('role', 'tablist');
technologyNav.setAttribute('aria-label', '살펴볼 제작 기술');
const technologySummaries = [
  ['이미지 → 영상 프롬프트', 'VLM · Ollama · MiniMax H3'],
  ['LoRA 관리 → 프롬프트 준비', 'Python · ComfyUI'],
  ['문구 저장 → 선택 → 연결', 'Python · JavaScript · ComfyUI'],
];
technologyProjects.forEach((project, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.id = `technology-tab-${project.id}`;
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-controls', project.id);
  button.dataset.technology = project.id;
  const number = document.createElement('span');
  number.className = 'technology-index';
  number.dataset.number = `0${index + 1}`;
  number.textContent = `0${index + 1} / TOOL`;
  const title = document.createElement('strong');
  title.textContent = project.querySelector('h2').textContent;
  const description = document.createElement('span');
  description.textContent = technologySummaries[index][0];
  const stack = document.createElement('small');
  stack.textContent = technologySummaries[index][1];
  button.append(number, title, description, stack);
  button.addEventListener('click', () => selectTechnology(project.id, { updateUrl: true }));
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? technologyProjects.length - 1 :
      (index + (event.key === 'ArrowRight' ? 1 : -1) + technologyProjects.length) % technologyProjects.length;
    selectTechnology(technologyProjects[next].id, { focus: true, updateUrl: true });
  });
  technologyNav.append(button);
  project.setAttribute('role', 'tabpanel');
  project.setAttribute('aria-labelledby', button.id);
  project.tabIndex = 0;
});
byId('technology').querySelector('.page-intro').after(technologyNav);
function selectTechnology(key, { focus = false, updateUrl = false } = {}) {
  technologyProjects.forEach(project => {
    project.hidden = project.id !== key;
    if (project.hidden) project.querySelectorAll('video').forEach(video => video.pause());
  });
  technologyNav.querySelectorAll('button').forEach(button => {
    const selected = button.dataset.technology === key;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && focus) button.focus();
  });
  if (updateUrl && location.hash !== `#${key}`) history.pushState(null, '', `#${key}`);
}
// Long examples stay available on demand, without dominating the overview.
const promptDemo = document.querySelector('.prompt-demo');
const promptHeading = document.querySelector('.vlm-example-heading');
if (promptDemo && promptHeading) {
  const details = document.createElement('details');
  details.className = 'technology-example';
  const summary = document.createElement('summary');
  summary.textContent = '변환 예시 · 입력 이미지와 H3 프롬프트 보기';
  promptHeading.before(details);
  details.append(summary, promptHeading, promptDemo);
}
selectTechnology(technologyProjects[0].id);
window.addEventListener('hashchange', routePortfolio);
routePortfolio();
