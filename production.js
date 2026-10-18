'use strict';

// The new production is first; the existing film remains an independent case.
(() => {
  const panels = [...document.querySelectorAll('[data-video-case-panel]')];
  const buttons = [...document.querySelectorAll('[data-video-case]')];
  window.selectVideoCase = (id, focus = false) => {
    if (!panels.some(panel => panel.id === id)) return;
    for (const panel of panels) {
      panel.hidden = panel.id !== id;
      if (panel.hidden) panel.querySelectorAll('video').forEach(video => video.pause());
    }
    for (const button of buttons) {
      const active = button.dataset.videoCase === id;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    }
    const sceneDialog = document.getElementById('scene-dialog');
    if (id !== 'video-school-case' && sceneDialog?.open) sceneDialog.close();
  };
  buttons.forEach((button, index) => {
    const select = next => {
      window.selectVideoCase(buttons[next].dataset.videoCase, true);
      history.pushState(null, '', `#${buttons[next].dataset.videoCase}`);
    };
    button.addEventListener('click', () => select(index));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      select(event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length);
    });
  });
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function field(container, title, text) {
    if (!text) return;
    const row = element('div', undefined, 'case-field');
    row.append(element('h4', title), element('p', text));
    container.append(row);
  }
  function tabs(items, containerId, panelId, label, render) {
    const container = document.getElementById(containerId);
    const panel = document.getElementById(panelId);
    const controls = items.map((item, index) => {
      const button = element('button', label(item));
      button.type = 'button'; button.id = `${containerId}-${index}`;
      button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', panelId);
      button.addEventListener('click', () => select(index));
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        select(event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + controls.length) % controls.length, true);
      });
      return button;
    });
    function select(index, focus = false) {
      controls.forEach((button, i) => {
        button.setAttribute('aria-selected', String(i === index)); button.tabIndex = i === index ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', controls[index].id);
      render(items[index]);
      if (focus) { controls[index].focus(); controls[index].scrollIntoView({block: 'nearest', inline: 'nearest'}); }
    }
    container.replaceChildren(...controls);
    select(0);
    return select;
  }
  Promise.all([
    fetch('assets/production/subway/storyboard.json').then(r => { if (!r.ok) throw new Error('storyboard'); return r.json(); }),
    fetch('assets/production/subway/video-prompts.json').then(r => { if (!r.ok) throw new Error('prompts'); return r.json(); }),
  ]).then(([doc, prompts]) => {
    const cast = document.getElementById('case-personas'); cast.replaceChildren();
    const names = Object.fromEntries(doc.brief.characters.map(c => [c.id, c.name]));
    doc.brief.characters.forEach(character => {
      const card = element('article'); card.append(element('h4', character.name));
      field(card, '성격', character.personality); field(card, '말투', character.speech); cast.append(card);
    });
    const original = document.getElementById('case-original-input');
    for (const [key, title] of Object.entries({title:'저장 제목', relationship:'관계', location:'장소', time:'시간', atmosphere:'분위기', situation:'시작 상황', intent:'원하는 상호작용', ending:'결말', style:'연출 스타일'})) field(original, title, doc.brief[key]);
    original.append(element('p', '최신 원본은 11컷·43초입니다. 공개본은 S01~S07의 7컷·30초를 발췌했으며, 이 구성의 결말·요약·목표 길이는 발췌 범위에 맞춰 정리했습니다. 원본 전체는 별도 JSON으로 보존합니다.', 'case-source-note'));
    document.getElementById('case-summary').textContent = doc.story.summary;
    const selectShot = tabs(doc.story.shots, 'case-shot-list', 'case-shot-panel', shot => `${shot.id} · ${shot.duration}초`, shot => {
      const panel = document.getElementById('case-shot-panel'); panel.replaceChildren();
      panel.append(element('h4', `${shot.id} · ${shot.camera.size}`));
      field(panel, '보여주려는 것', shot.purpose); field(panel, '화면', shot.visual);
      field(panel, '행동', shot.actions.join('\n'));
      const speech = element('div', undefined, 'case-dialogue');
      shot.dialogue.forEach(line => {
        const quote = element('blockquote'); quote.append(element('strong', names[line.speaker]), element('p', line.text), element('small', line.delivery)); speech.append(quote);
      });
      if (!shot.dialogue.length) speech.append(element('p', '대사 없이 행동과 반응으로 이어지는 컷입니다.'));
      panel.append(speech);
      field(panel, '카메라', `${shot.camera.angle} / ${shot.camera.movement}\n${shot.camera.transition}`);
    });
    const shots = Object.fromEntries(doc.story.shots.map(shot => [shot.id, shot]));
    const evidence = [
      {title: '성격의 대비', request: '밝고 낙관적인 소라와 피곤해 보여도 이야기를 들어주는 하루.',
        result: `${shots.S03.actions[1]}\n${shots.S03.actions[2]}`, ids: ['S03']},
      {title: '일본어로 이어지는 대화', request: '휴대폰 분실 이야기에서 친구에게 전화를 부탁하고, 뜻밖의 통화 상대를 밝히는 흐름.',
        result: `S04 · ${shots.S04.dialogue[0].text}\nS06 · ${shots.S06.dialogue[0].text}`, ids: ['S04', 'S06']},
      {title: '작은 반응의 연출', request: '들뜬 소라와 나른한 하루의 성격 차이를, 대사 뒤의 눈깜박임과 작은 미소로 이어가기.',
        result: `${shots.S07.actions[0]}\n${shots.S07.actions[1]}`, ids: ['S07']},
    ];
    const evidenceContainer = document.getElementById('case-intent-evidence');
    evidenceContainer.replaceChildren();
    evidence.forEach(item => {
      const card = element('article'); card.append(element('h4', item.title));
      field(card, '내가 정한 방향 · 요약', item.request);
      field(card, '콘티에서 구현된 모습 · 발췌', item.result);
      const links = element('div', undefined, 'intent-shot-links');
      item.ids.forEach(id => {
        const button = element('button', `${id} 컷에서 확인`);
        button.type = 'button';
        button.addEventListener('click', () => {
          selectShot(doc.story.shots.findIndex(shot => shot.id === id), true);
          const panel = document.getElementById('case-shot-panel');
          panel.focus({preventScroll: true});
          panel.scrollIntoView({block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
        });
        links.append(button);
      });
      card.append(links); evidenceContainer.append(card);
    });
    document.getElementById('case-reference-count').textContent = `캐릭터 2장·배경 1장, 총 ${prompts.reference_count}장의 참조 이미지`;
    tabs(prompts.clips, 'case-clip-list', 'case-prompt-panel', clip => `${clip.id} · ${clip.duration}초`, clip => {
      document.getElementById('case-prompt-text').textContent = clip.prompt;
      document.getElementById('case-clip-scope').textContent = `${clip.shots.map(s => s.id).join(' · ')} / 프롬프트 설계 구간 ${clip.timeline_start}~${clip.timeline_end}초 · 최종 영상은 편집 후 27.46초`;
    });
  }).catch(() => {
    document.getElementById('case-summary').textContent = '자료를 불러오지 못했습니다. 아래 JSON·TXT 다운로드로 원문을 확인할 수 있습니다.';
    document.getElementById('case-personas').textContent = '입력 원문은 공개용 콘티 JSON에서 확인할 수 있습니다.';
    document.getElementById('case-prompt-text').textContent = '전체 프롬프트 TXT 또는 JSON을 다운로드해 확인해주세요.';
  });
})();
