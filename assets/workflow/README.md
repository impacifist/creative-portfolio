# H3 롱테이크 공개 연결도

확인 원본: `Dasiwa_H3_LongTakeNoCuts_3Clips.json` (루트 9개 노드, 서브그래프 88개 노드).
검토 시 원본 SHA256: `87f77ac443f1d92ef2a5c5c99279763fed9cc8c982b65f65b127a7feed8129bb`.

`longtake-data.js`는 원본을 17개 기능 그룹으로 묶어 설명합니다. 노드를 선택하면 역할과 대응하는 원본 ID를 볼 수 있습니다. 실제 전체 노드 JSON의 복제나 실행 가능한 ComfyUI 워크플로우는 아닙니다. 개인 위젯 값·프롬프트·모델/입출력 경로·시드는 포함하지 않았습니다.

대조한 주요 연결:

| 원본 출발 | 도착 | 의미 |
|---|---|---|
| Sampler #2591.output | Motion Context #6007.context_latent | 1→2 구간의 직접 latent 전달 |
| Blend #6015.latent | Motion Context #6022.context_latent | 2→3 구간의 혼합 latent 전달 |
| Sampler #6010.output | Sampler #6013.latent_image | 구간 2의 두 단계 샘플링 |
| Sampler #6025.output | Sampler #6028.latent_image | 구간 3의 두 단계 샘플링 |
| Motion Context #6007.trim_frames | Trim #6018.trim_frames | 구간 2의 동적 중복 제거량 |
| Motion Context #6022.trim_frames | Trim #6033.trim_frames | 구간 3의 동적 중복 제거량 |

Blend #6015/#6030의 저장 값은 `0:0, 22:0, 44:1`, `linear`, `audio_source=latent1`, `blend_audio=false`입니다. 실제 Blend 구현에서 픽셀 프레임 키를 latent 시간축으로 매핑하고 `(1-w)*video1 + w*video2`로 혼합하는 것을 확인했습니다. Motion Context의 직접 latent 경로, 해상도·채널 불일치 검사도 해당 노드 구현과 대조했습니다.

공개 페이지의 상세 표는 공통 자원·Director·Guide, 문맥 전달, 샘플링·혼합, 디코딩·Trim·누적 연결, 선택적 자원 제어·후처리를 구분합니다. 연결도의 후처리 그룹은 원본에 배치된 경로를 설명하며 특정 실행에서 모두 켜졌음을 주장하지 않습니다. 성능·무손실·장편 품질의 정량 결과는 측정하지 않았습니다.

기존 2클립·VLM 연결도는 이번 소개에서 교체했습니다. 생성기에 입력하는 콘티의 컷 수와 워크플로우의 생성 구간 수는 별개의 단위입니다.
