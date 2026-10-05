# AI Visual Portfolio

LoRA 이미지 생성, AI 애니메이션 제작, VLM 프롬프트 자동화와 ComfyUI 제작 도구를 소개합니다.

**포트폴리오:** https://impacifist.github.io/creative-portfolio/

## 구성

- 영상 제작: 30초 등교 애니메이션(완성본 29.24초), 두 클립의 스틸과 입력 프롬프트, 제작 기여와 PC 사양
- 이미지 생성: 두 캐릭터의 공식 참조 이미지와 LoRA 생성 결과, 데이터 전처리와 학습 과정
- 기술·파이프라인: VLM 프롬프트 변환 구조, 데이터셋 툴, Prompt Selector 프롬프트 라이브러리
- Video Control Studio: 직접 개발한 제어 맵 추출·비교 도구의 목적, 기능, 비교 영상과 한국어 UI
- 워크플로우: 드래그·확대와 노드 이동이 가능한 기능 연결도, 노드별 짧은 설명과 사용 순서

영상은 웹 재생용 H.264 사본이며 2752×1536, 48fps입니다. 원본은 로컬에 별도로 보존합니다.
원작 캐릭터 기반의 비공식 개인 작업으로, 캐릭터·이미지·외부 도구의 출처와 제작 기여는 페이지에 표기했습니다.
워크플로우 설명은 실제 두 클립 구성의 연결 관계를 바탕으로 새로 작성했습니다. 원본 워크플로우 이름·JSON·개인 프롬프트·파일 경로를 공개 자료에 복사하지 않습니다. 외부 모델·노드의 기능과 본인의 연결·활용 기여를 구분합니다.

## 로컬 확인

저장소 폴더에서 `python -m http.server 4173 --bind 127.0.0.1`을 실행하고 http://127.0.0.1:4173/ 에 접속합니다.
별도 빌드나 패키지 설치가 필요 없는 정적 사이트입니다.

## 배포

GitHub Pages는 `main` 브랜치의 루트(`/`)를 게시합니다. `.nojekyll`을 포함하며 내부 링크는 상대 경로를 사용합니다.
로컬 검토 자료, 비공개 작업 파일, 사용하지 않는 미디어와 이전 레이아웃은 게시 대상에서 제외합니다.
검색 제외 메타 태그는 접근 제어 기능이 아닙니다.

공개 기술 프로젝트: https://github.com/impacifist/local-vlm-video-prompt-pipeline

Prompt Selector: https://github.com/impacifist/ComfyUI-Prompt-Selector
공개 예제만 담은 별도 테스트 환경의 화면을 사용하며, 개인 작업 화면이나 개인 프롬프트는 포함하지 않습니다.

Video Control Studio: https://github.com/impacifist/ComfyUI-Video-Control-Studio

`assets/video-control-studio/`의 한국어 UI 캡처와 비교 MP4는 위 공개 저장소의 커밋 `08489d5e6ab63b8aa6548d751078050429ad340e`에서 가져왔습니다. 원본 경로는 `docs/studio-ko.png`, `docs/control-comparison.mp4`입니다. MP4는 동일한 3초 구간의 Pose·Depth·Canny 제어 맵 비교이며 24 FPS입니다. UI 캡처에는 공개 도형 예제를 사용합니다. 원본 영상과 오디오는 포함하지 않으며 패키지 MIT 라이선스는 원본 영상의 권리를 부여하지 않습니다.
