/* 작품 추가·수정은 이 데이터에서 시작합니다. 확인되지 않은 제작 설정을 추정하지 않습니다. */
window.portfolioCases = {
  kotone: {
    name: '후지타 코토네', work: '학원 아이돌마스터 / 学園アイドルマスター',
    reference: 'assets/kotone-reference.webp', generated: 'assets/kotone-generated.png',
    referenceSize: [690, 947],
    referenceAlt: '후지타 코토네 참조 이미지. 금발 땋은 머리, 노란 티셔츠, 민트·보라색 재킷, 한 손 브이 포즈.',
    generatedAlt: '후지타 코토네 LoRA 생성 결과. 양손 브이 포즈와 미소, 금발 땋은 머리, 민트·보라색 재킷.',
    preserved: '금발의 양갈래 땋은 머리와 검은 리본, 노란 티셔츠와 민트·보라 계열 재킷의 배색이 관찰됩니다.',
    variation: '한 손을 이마에 올린 자세에서 양손 브이 포즈로 바뀌었습니다. 표정과 화면에 보이는 신체 범위도 달라졌습니다.',
    limitations: '티셔츠의 레터링과 재킷의 색 면적, 머리 장식에 차이가 있습니다. 세부 문양과 의상 구조는 추가 비교가 필요합니다.',
    credit: '학원 아이돌마스터 · 藤田 ことね / THE IDOLM@STER™& ©Bandai Namco Entertainment Inc.',
    official: 'https://gakuen.idolmaster-official.jp/idol/kotone/', officialLabel: '공식 캐릭터 소개',
    directSource: 'https://gakuen.idolmaster-official.jp/idol/kotone/',
  },
  velina: {
    name: '벨리나', work: '젠레스 존 제로 / Zenless Zone Zero',
    reference: 'assets/velina-reference.webp', generated: 'assets/velina-generated.png',
    referenceSize: [1520, 1895],
    referenceAlt: '젠레스 존 제로 벨리나 참조 이미지. 은보라색 긴 머리, 뾰족한 귀, 청백색 의상과 펼친 부채.',
    generatedAlt: '벨리나 LoRA 생성 결과. 은보라색 긴 머리와 큰 리본, 청백색 의상, 몸을 앞으로 기울인 구도.',
    preserved: '은보라색 긴 머리, 뾰족한 귀, 큰 리본과 금색 장식, 청색·백색 중심의 의상 배색이 관찰됩니다.',
    variation: '부채를 펼친 전신 동작에서 상체 중심의 새로운 자세로 바뀌었습니다. 얼굴 방향과 표정, 의상 주름의 표현도 달라졌습니다.',
    limitations: '부채는 생성 결과에 나타나지 않으며, 리본 문양과 의상 구조에 차이가 있습니다. 소품과 세부 장식의 유지 여부를 더 확인할 필요가 있습니다.',
    credit: '젠레스 존 제로 · 벨리나 / 작품·캐릭터: HoYoverse.',
    official: 'https://zenless.hoyoverse.com/ko-kr/', officialLabel: '공식 작품 사이트',
    directSource: 'https://zenless.hoyoverse.com/ko-kr/',
  },
};
