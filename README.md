# AI Visual Portfolio
**포트폴리오:** https://impacifist.github.io/creative-portfolio/

기술·파이프라인의 첫 항목은 [AI 영상 스토리보드 생성기](https://github.com/impacifist/ai-video-storyboard-generator)입니다. 한국어 제작 화면과 30초 콘티를 15초씩 두 클립으로 변환하는 모의 AI 예시를 소개합니다. 캡처 원본은 해당 저장소의 `docs/screenshots/create-ko.png`, `convert-ko.png`이며 개인 설정·API 키·개인 콘티는 포함하지 않습니다.

PC에서는 최대 1520px까지 사용하고, 기술 도구 목록·설명·실제 화면을 가로로 배치합니다. 영상·이미지 탭도 소개와 결과를 나란히 보여주며, 1200px 미만에서는 한 열 중심의 배치를 사용합니다. `desktop.css`가 기본 배치를, `studio.css`가 작품 중심의 여백·타이포그래피·색상과 반응형 마감을 담당합니다.

모션은 [TakayuStudio Motion Reference](https://motion-reference.takayustudio.jp/index.html)의 Mask Wipe와 Stagger Follow를 참고해 `studio.js`에서 직접 구현했습니다. 제목·대표 작품의 짧은 등장, 탭 선택 배경 이동, 스틸 이미지 확대와 펼침 반응을 사용합니다. 외부 애니메이션 패키지는 사용하지 않으며, 운영체제의 동작 줄이기 설정을 따릅니다. JavaScript 없이도 기본 영상 화면은 표시됩니다.

로컬 확인: 저장소 폴더에서 `python -m http.server 4186 --bind 127.0.0.1`을 실행한 뒤 `http://127.0.0.1:4186/`에 접속합니다.

대표 영상 아래의 필름 스트립은 완성 영상의 스틸 여섯 장을 가로로 보여줍니다. 장면을 누르면 확대 화면에서 좌우 버튼·방향키로 넘길 수 있으며 Escape로 닫습니다. 작업 노트는 기존 연출 설명을 바탕으로 장면별 의도를 풀어 썼으며, 제작 횟수·성과 같은 미확인 경험은 추가하지 않았습니다. JavaScript 없이도 이미지 링크와 첫 작업 노트를 볼 수 있습니다.

디자인 검토에는 [Anthropic frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) 지침을 참고했습니다. 스킬 파일은 사이트에 포함하지 않습니다.
