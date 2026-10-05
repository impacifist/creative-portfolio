'use strict';
// Public explanations authored from connections, never loaded from a private workflow.
const stages = [
  {
    title: '입력 준비', summary: '참조 이미지 + 클립별 지시',
    purpose: '이미지의 시각 정보와 사람이 원하는 연출을 분리해 준비합니다.',
    input: '참조 이미지 한 장, 첫 번째·두 번째 클립의 연출 지시',
    functions: '이미지 로드 → VLM 이미지 입력 / Prompt Selector 두 개 → 각 VLM의 텍스트 입력',
    output: '같은 참조 이미지와 서로 다른 클립별 지시를 두 프롬프트 생성 경로로 전달',
    use: '이미지를 고른 뒤 각 클립에서 일어날 동작과 카메라 방향을 따로 준비합니다. 재사용할 지시는 저장하고, 원본을 고칠 때는 수정합니다.',
    note: '여기서 로드한 이미지는 두 VLM의 입력으로 연결됩니다. 영상 생성기의 참조 조건은 별도의 생성 가이드에서 구성합니다.'
  },
  {
    title: '프롬프트 구성', summary: '이미지 해석 → 클립별 텍스트',
    purpose: '이미지와 연출 지시를 영상 생성에 넣을 텍스트로 바꿉니다.',
    input: '참조 이미지 + 각 Prompt Selector의 현재 텍스트',
    functions: '공유 Ollama 연결·옵션 → OllamaGenerateV2 두 개 → 텍스트 확인 → 클립별 Director 입력',
    output: '첫 클립용 프롬프트와 다음 클립용 프롬프트',
    use: '생성된 문장에서 인물 묘사, 동작, 카메라 방향이 의도와 맞는지 확인합니다. 수정이 필요하면 해당 클립의 지시를 조정합니다.',
    note: '두 VLM은 각각 입력을 받습니다. 첫 VLM의 결과가 두 번째 VLM으로 자동 전달되는 대화 체인은 아닙니다.'
  },
  {
    title: '생성 조건 설정', summary: '가이드 · LoRA · 시드',
    purpose: '공통 모델 자원은 공유하면서 클립별 연출과 변형 조건을 나눕니다.',
    input: '클립별 프롬프트, 모델·텍스트 인코더·영상/오디오 VAE',
    functions: 'Director 두 개 → 클립별 LoRA 로더 → DirectorGuide / 개별 시드 → 샘플러',
    output: '각 클립의 conditioning·초기 latent·모델·노이즈',
    use: '클립별 모드와 길이를 정하고 필요한 LoRA를 선택합니다. 두 번째 클립의 너비·높이는 첫 번째 설정에서 전달받습니다. 샘플러·스케줄러·스텝은 공통 설정으로 관리합니다.',
    note: '캐시·연산 설정·프리뷰도 연결되어 있습니다. 특정 모델 파일명, LoRA 이름, 개인별 수치는 공개 도식에 담지 않았습니다.'
  },
  {
    title: '첫 클립 생성', summary: '영상 · 오디오 · latent',
    purpose: '다음 생성의 기준이 될 첫 클립을 만들고 별도 저장 경로를 둡니다.',
    input: '첫 클립의 가이드·모델·시드·샘플링 설정',
    functions: 'SamplerCustomAdvanced → 영상 VAE Decode + Audio Decode → 첫 클립 저장',
    output: '저장 노드를 통과한 프레임 + 샘플러 latent → 문맥 단계 / 첫 영상·오디오 → 연결 단계',
    use: '첫 클립의 결과를 따로 확인할 수 있게 보관합니다. 이후 클립과 연결할 때는 마지막 부분의 자세와 움직임을 기준으로 봅니다.',
    note: '첫 클립은 개별 파일과 최종 연결 영상으로 각각 확인할 수 있습니다. 문맥에 넘기는 latent는 첫 샘플러의 출력에서 가져옵니다.'
  },
  {
    title: '움직임 문맥 전달', summary: '이전 프레임 + latent',
    purpose: '이전 클립의 움직임 정보를 다음 클립의 생성 조건에 반영합니다.',
    input: '첫 클립의 프레임·latent + 두 번째 클립의 conditioning·초기 latent',
    functions: 'MiniMaxH3MotionContext → 두 번째 클립의 conditioning 갱신',
    output: '문맥이 반영된 conditioning → 다음 샘플러 / trim_frames → 중복 구간 제거',
    use: '다음 클립의 지시는 이어질 동작을 설명하도록 준비합니다. 문맥에 사용할 프레임 범위는 생성 결과를 보며 조정할 수 있습니다.',
    note: '영상 프레임과 latent가 함께 연결됩니다. 외형이나 동작의 연속성은 결과에서 직접 확인합니다.'
  },
  {
    title: '다음 클립 생성', summary: '새 지시 + 이전 움직임',
    purpose: '새로운 연출 지시와 앞 클립의 문맥을 함께 사용해 두 번째 클립을 생성합니다.',
    input: '두 번째 클립의 모델·시드·초기 latent + 문맥이 반영된 conditioning',
    functions: 'BasicGuider → SamplerCustomAdvanced → 영상·오디오 Decode',
    output: '두 번째 클립의 영상 프레임과 오디오',
    use: '첫 클립에서 이어지는 동작인지 확인합니다. 연결이 어색하면 두 번째 지시나 생성 조건을 조정해 다시 비교합니다.',
    note: '현재 구성은 두 클립을 연결합니다. 각 클립의 생성 결과와 접합부를 사람이 검토합니다.'
  },
  {
    title: '중복 정리 · 연결', summary: '영상과 오디오를 함께 정리',
    purpose: '문맥으로 겹친 구간을 제거한 뒤 두 클립을 순서대로 연결합니다.',
    input: '첫 클립 + 두 번째 클립 + Motion Context에서 전달한 trim_frames',
    functions: 'MiniMaxH3MotionContextTrim → ImageBatch / AudioConcat',
    output: '연결된 프레임 → 영상 후처리 / 연결된 오디오 → 최종 저장',
    use: '접합부에서 동작이 반복되거나 갑자기 바뀌는지, 소리가 끊기거나 어긋나지 않는지 확인합니다.',
    note: '이미지와 오디오를 각각 연결합니다. 오디오는 영상 프레임 보간·업스케일 경로를 거치지 않습니다.'
  },
  {
    title: '후처리 · 저장', summary: '프레임 보간 → 화질 처리',
    purpose: '연결된 영상의 프레임과 출력 형식을 정리하고 오디오와 함께 저장합니다.',
    input: '연결된 영상 프레임 + 별도 경로의 연결된 오디오',
    functions: 'FrameInterpolate → 선택적 리사이즈·모델 업스케일 → RTX 화질 처리 → 선택적 워터마크 → 영상 저장',
    output: '후처리된 프레임 + 출력 FPS + 연결된 오디오 → 최종 비디오',
    use: '생성 결과를 확인한 후 필요한 후처리만 켭니다. 보간 배수와 출력 FPS를 맞추고 최종 파일에서 재생 속도·화질·음성 동기를 확인합니다.',
    note: '확인한 구성은 프레임 보간과 RTX 처리를 사용합니다. 리사이즈·모델 업스케일·워터마크·클립별 latent 업스케일은 선택적으로 켜는 기능입니다.'
  }
];
const nav = document.getElementById('stages');
function select(index, updateHash = true) {
  const stage = stages[index];
  [...nav.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  document.getElementById('detail-number').textContent = String(index + 1).padStart(2, '0');
  document.getElementById('detail-title').textContent = stage.title;
  for (const field of ['purpose', 'input', 'functions', 'output', 'use', 'note']) document.getElementById(`detail-${field}`).textContent = stage[field];
  if (updateHash) history.replaceState(null, '', `#step-${index + 1}`);
}
stages.forEach((stage, index) => {
  const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-controls', 'detail');
  for (const [tag, text] of [['span', `${String(index + 1).padStart(2, '0')} →`], ['strong', stage.title], ['small', stage.summary]]) {
    const element = document.createElement(tag); element.textContent = text; button.append(element);
  }
  button.addEventListener('click', () => select(index));
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? stages.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + stages.length) % stages.length;
    select(next); nav.children[next].focus();
  });
  nav.append(button);
});
const initial = /^#step-([1-8])$/.exec(location.hash);
select(initial ? Number(initial[1]) - 1 : 0, false);
