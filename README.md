https://impacifist.github.io/creative-portfolio/

기본 언어는 영어입니다. 상단 지구본 아이콘을 누르면 English·한국어·日本語 메뉴가 열리며, 직접 선택한 언어는 브라우저에 저장합니다. `?lang=en#video`, `?lang=ja#workflow`처럼 링크로 언어와 탭을 지정할 수도 있습니다. URL에 지정한 언어, 저장한 선택, 기본 영어 순으로 적용하며, 브라우저의 언어 설정은 사용하지 않습니다. 기술 노트와 연결도에도 같은 언어를 적용합니다. 메뉴는 방향키·Home·End로 이동하고 Escape 또는 바깥 클릭으로 닫습니다.

번역은 `locales/content.js`, `locales/tools.js`, `locales/workflow.js`에서 한국어 원문을 키로 관리합니다. 본문을 변경할 때 해당 번역도 함께 갱신합니다. 영상·원본 UI 캡처·다운로드 자료·일본어 원문 대사·영어 생성 프롬프트는 제작 증거로 유지하며, 언어 선택은 화면의 설명과 접근성 문구를 바꿉니다. 외부 번역 서비스나 새 실행 의존성은 사용하지 않습니다.

로컬 확인: `python -m http.server 4186 --bind 127.0.0.1` 실행 후 `http://127.0.0.1:4186/`에 접속합니다.

브라우저 검증은 Playwright가 설치된 환경에서 서버 실행 후 `node tests/languages.cjs`로 수행합니다. 별도 설치 경로를 쓰는 경우 `PLAYWRIGHT_MODULE`, 다른 서버를 쓰는 경우 `PORTFOLIO_URL` 환경변수를 지정할 수 있습니다.

