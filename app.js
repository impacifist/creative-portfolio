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
  if (updateUrl) window.scrollTo({ top: 0, behavior: 'instant' });
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
  if (target && panel) requestAnimationFrame(() => {
    if (target === panel) window.scrollTo({ top: 0, behavior: 'instant' });
    else target.scrollIntoView({ block: 'start' });
  });
}
// Page-level shortcuts preserve the selected portfolio and its URL.
document.querySelectorAll('a[href="#"]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    portfolioTabs.find(tab => tab.getAttribute('aria-selected') === 'true').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
});
document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  const panel = portfolioPanels.find(panel => !panel.hidden);
  panel.focus({ preventScroll: true });
  panel.scrollIntoView({ block: 'start' });
});
// Keep the original articles intact: without JavaScript every project remains readable.
const technologyProjects = [...document.querySelectorAll('#technology .project-row')];
const technologyNav = document.createElement('div');
technologyNav.className = 'technology-nav';
technologyNav.setAttribute('role', 'tablist');
technologyNav.setAttribute('aria-label', '살펴볼 제작 기술');
const technologySummaries = {
  'storyboard-generator': ['캐릭터 → 콘티 → 영상 프롬프트', 'Python · JavaScript · AI API'],
  'vlm-pipeline': ['이미지 → 영상 프롬프트', 'VLM · Ollama · MiniMax H3'],
  'dataset-tools': ['LoRA 관리 → 프롬프트 준비', 'Python · ComfyUI'],
  'prompt-selector': ['문구 저장 → 선택 → 연결', 'Python · JavaScript · ComfyUI'],
};
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
  number.textContent = `0${index + 1}`;
  const title = document.createElement('strong');
  title.textContent = project.querySelector('h2').textContent;
  const description = document.createElement('span');
  description.textContent = technologySummaries[project.id][0];
  const stack = document.createElement('small');
  stack.textContent = technologySummaries[project.id][1];
  button.append(number, title, description, stack);
  button.addEventListener('click', () => selectTechnology(project.id, { updateUrl: true }));
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? technologyProjects.length - 1 :
      (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + technologyProjects.length) % technologyProjects.length;
    selectTechnology(technologyProjects[next].id, { focus: true, updateUrl: true });
  });
  technologyNav.append(button);
  project.setAttribute('role', 'tabpanel');
  project.setAttribute('aria-labelledby', button.id);
  project.tabIndex = 0;
});
byId('technology').querySelector('.page-intro').after(technologyNav);
byId('technology').classList.add('technology-enhanced');
const technologyDesktop = window.matchMedia('(min-width: 1200px)');
function updateTechnologyOrientation() {
  technologyNav.setAttribute('aria-orientation', technologyDesktop.matches ? 'vertical' : 'horizontal');
}
updateTechnologyOrientation();
technologyDesktop.addEventListener('change', updateTechnologyOrientation);
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

// Group each project's explanation beside its evidence on wide screens.
document.querySelectorAll('#technology .project-row, #video-control-studio .project-row').forEach(project => {
  const body = project.lastElementChild;
  const layout = document.createElement('div');
  layout.className = 'project-layout';
  const copy = document.createElement('div');
  copy.className = 'project-copy';
  const media = document.createElement('div');
  media.className = 'project-media';
  [...body.children].forEach(child => {
    (child.matches('.dataset-capture, .technology-example, .model-detail') ? media : copy).append(child);
  });
  layout.append(copy, media);
  body.append(layout);
});

// Each single-map clip is a spatial crop of the same public comparison video.
const controlVideo = byId('control-preview');
const controlChoices = [...document.querySelectorAll('[data-control-view]')];
const controlViews = {
  all: ['control-comparison.mp4', '전체 비교 · 왼쪽 Pose / 가운데 Depth / 오른쪽 Canny', 1152],
  pose: ['pose.mp4', 'Pose · 자세와 움직임을 확인합니다.', 384],
  depth: ['depth.mp4', 'Depth · 장면의 깊이와 배치를 확인합니다.', 384],
  canny: ['canny.mp4', 'Canny · 윤곽선과 장면 구조를 확인합니다.', 384],
};
function selectControlView(key) {
  const [file, label, width] = controlViews[key];
  controlVideo.pause();
  controlVideo.src = `assets/video-control-studio/${file}`;
  controlVideo.width = width;
  controlVideo.setAttribute('aria-label', label);
  byId('control-caption').textContent = label;
  controlChoices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.controlView === key)));
  controlVideo.load();
}
controlChoices.forEach(button => button.addEventListener('click', () => selectControlView(button.dataset.controlView)));
selectControlView(window.matchMedia('(max-width: 600px)').matches ? 'pose' : 'all');
window.addEventListener('hashchange', routePortfolio);
window.addEventListener('pageshow', routePortfolio);
routePortfolio();
