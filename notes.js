'use strict';
function updateNotesReturn() {
  const target = document.getElementById(location.hash.slice(1));
  const section = target?.closest('section');
  const destinations = {
    'image-process': ['images', '이미지 생성'],
    'vlm-design': ['vlm-pipeline', '프롬프트 자동화'],
    'dataset-implementation': ['dataset-tools', '데이터셋 툴'],
  };
  const [id, label] = destinations[section?.id] || ['technology', '포트폴리오'];
  document.querySelectorAll('[data-notes-return]').forEach(link => {
    link.href = `index.html#${id}`;
    link.textContent = `← ${label}로 돌아가기`;
  });
}
window.addEventListener('hashchange', updateNotesReturn);
updateNotesReturn();
