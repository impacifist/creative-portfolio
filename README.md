# AI Visual Portfolio
**포트폴리오:** https://impacifist.github.io/creative-portfolio/

첫 사례의 제작 과정에는 “내가 정한 방향 → 콘티에서 구현된 모습” 비교를 추가했습니다. 성격 대비(S03), 일본어 대화 흐름(S06·S09), 요청한 결말(S14·S15)을 저장 원문에서 발췌하고 해당 컷으로 바로 이동합니다. 의도 설명은 입력의 요약이고 결과는 콘티 발췌로 구분합니다. 완성 영상의 품질이나 전 과정이 무수정 AI 출력임을 주장하지 않습니다.

영상 제작 탭의 첫 사례는 **지하철에서 나누는 두 친구의 이야기**입니다. 2026-10-16 오후 2:31에 저장한 15컷·45초 콘티와 제공된 `video-prompts.json`의 원본 해시를 대조했습니다. 실제 페르소나·입력 원문, 15컷 탐색과 세 구간 프롬프트를 `production.js`가 읽어 표시합니다. 영상은 제작 중으로 표시하며 재생 파일을 꾸며 넣지 않았습니다. 기존 **30초 등교** 영상·스틸·프롬프트는 두 번째 사례에 보존했습니다. `#video-current-case`, `#video-school-case`로 직접 접근하며 기본 대문은 첫 사례입니다. 새 별도 페이지는 만들지 않습니다.

공개 자료는 `assets/production/subway/`에 있으며 입력과 story, 최종 프롬프트를 보존하되 저장 이력·개인 경로·참조 파일명·시스템 프롬프트·API 설정은 제외했습니다. 저장 제목에 버스가 언급되지만 실제 배경은 지하철이며 사용자의 확인을 받아 이 기준으로 소개합니다. 완성 영상이 준비되면 `.current-film`의 준비 영역을 그 작품의 `<video controls playsinline preload="none">`와 실제 포스터로 교체합니다.

워크플로우 탭은 **H3 기반 3구간 롱테이크 워크플로우** 원본과 해당 노드 구현을 읽고 다시 구성했습니다. `assets/workflow/longtake-data.js`는 17개 기능 그룹과 원본 노드 ID, 데이터 흐름을 정의하고 기존 viewer는 이동·확대·노드 상세 표시를 제공합니다. 본문은 공통 자원, latent 문맥, 두 단계 샘플링·혼합, 디코딩·중복 정리, 자원 제어·출력을 상세히 설명합니다. 개인 워크플로우 JSON과 위젯 입력은 배포하지 않습니다. 화질 열화 최소화는 설계 목적이며 정량 개선 결과로 소개하지 않습니다.

기술·파이프라인의 첫 항목은 [AI 영상 스토리보드 생성기](https://github.com/impacifist/ai-video-storyboard-generator)입니다. 한국어 제작 화면과 30초 콘티를 15초씩 두 클립으로 변환하는 모의 AI 예시를 소개합니다. 캡처 원본은 해당 저장소의 `docs/screenshots/create-ko.png`, `convert-ko.png`이며 개인 설정·API 키·개인 콘티는 포함하지 않습니다.

PC에서는 최대 1520px까지 사용하고, 기술 도구 목록·설명·실제 화면을 가로로 배치합니다. 영상·이미지 탭도 소개와 결과를 나란히 보여주며, 1200px 미만에서는 한 열 중심의 배치를 사용합니다. `desktop.css`가 기본 배치를, `studio.css`가 작품 중심의 여백·타이포그래피·색상과 반응형 마감을 담당합니다.

모션은 [TakayuStudio Motion Reference](https://motion-reference.takayustudio.jp/index.html)의 Mask Wipe와 Stagger Follow를 참고해 `studio.js`에서 직접 구현했습니다. 제목·대표 작품의 짧은 등장, 탭 선택 배경 이동, 스틸 이미지 확대와 펼침 반응을 사용합니다. 외부 애니메이션 패키지는 사용하지 않으며, 운영체제의 동작 줄이기 설정을 따릅니다. JavaScript 없이도 기본 영상 화면은 표시됩니다.

로컬 확인: 저장소 폴더에서 `python -m http.server 4186 --bind 127.0.0.1`을 실행한 뒤 `http://127.0.0.1:4186/`에 접속합니다.

대표 영상 아래의 필름 스트립은 완성 영상의 스틸 여섯 장을 가로로 보여줍니다. 장면을 누르면 확대 화면에서 좌우 버튼·방향키로 넘길 수 있으며 Escape로 닫습니다. 작업 노트는 기존 연출 설명을 바탕으로 장면별 의도를 풀어 썼으며, 제작 횟수·성과 같은 미확인 경험은 추가하지 않았습니다. JavaScript 없이도 이미지 링크와 첫 작업 노트를 볼 수 있습니다.

디자인 검토에는 [Anthropic frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) 지침을 참고했습니다. 스킬 파일은 사이트에 포함하지 않습니다.
