// ============================================================
// chart-configs.js - 차트 정의 배열
// 새 차트 추가: CHART_CONFIGS 배열에 객체 추가
// ============================================================

const CHART_CONFIGS = [

  // ══════════════════════════════════════════
  // ▶ 시장 (Market) — 핵심 지수
  // ══════════════════════════════════════════

  // ──────────────────────────────────────────
  // 1. S&P 500 지수
  // ──────────────────────────────────────────
  {
    id: 'sp500',
    title: 'S&P 500',
    description: 'S&P 500 지수 (일별)',
    category: 'market',
    series: [
      {
        id: 'sp500',
        label: 'S&P 500',
        type: 'fred',
        seriesId: 'SP500',
        units: 'lin',
        color: '#3b82f6',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 15 * 60 * 1000,
    unit: 'pts',
    format: 'integer',
    statusConfig: {
      type: 'drawdown',
      window: 252,
      thresholds: [
        { max: -0.20, label: '베어마켓',  color: '#ef4444' },
        { max: -0.10, label: '조정',      color: '#f97316' },
        { max: -0.05, label: '약세장',    color: '#fbbf24' },
        {             label: '강세장',    color: '#22c55e' },
      ],
    },
    reading: [
      '200일 이동평균선 위 = 강세장, 아래 = 약세장.',
      '고점 대비 -10% = 조정, -20% 이상 = 베어마켓 진입.',
      '저점 대비 +20% 이상 = 새 강세장 시작.',
    ],
  },

  // ──────────────────────────────────────────
  // 2. NASDAQ 종합지수
  // ──────────────────────────────────────────
  {
    id: 'nasdaq',
    title: 'NASDAQ 종합지수',
    description: 'NASDAQ Composite Index (일별) | FRED NASDAQCOM',
    category: 'market',
    series: [
      {
        id: 'nasdaq',
        label: 'NASDAQ',
        type: 'fred',
        seriesId: 'NASDAQCOM',
        units: 'lin',
        color: '#818cf8',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 15 * 60 * 1000,
    unit: 'pts',
    format: 'integer',
    statusConfig: {
      type: 'drawdown',
      window: 252,
      thresholds: [
        { max: -0.20, label: '베어마켓', color: '#ef4444' },
        { max: -0.10, label: '조정',     color: '#f97316' },
        { max: -0.05, label: '약세장',   color: '#fbbf24' },
        {             label: '강세장',   color: '#22c55e' },
      ],
    },
    reading: [
      '기술주 비중이 높아 S&P 500보다 변동성이 큼. 성장주 장세 판단에 유용.',
      '고점 대비 -10% = 조정, -20% 이상 = 베어마켓 진입.',
      'S&P 500 대비 NASDAQ 강세 = 성장주·기술주 선호 국면.',
    ],
  },

  // ──────────────────────────────────────────
  // 3. 다우존스 산업평균지수
  // ──────────────────────────────────────────
  {
    id: 'dow-jones',
    title: '다우존스 산업평균',
    description: 'Dow Jones Industrial Average (일별) | FRED DJIA — 2016년부터 제공',
    category: 'market',
    series: [
      {
        id: 'djia',
        label: '다우존스',
        type: 'fred',
        seriesId: 'DJIA',
        units: 'lin',
        color: '#34d399',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 15 * 60 * 1000,
    unit: 'pts',
    format: 'integer',
    statusConfig: {
      type: 'drawdown',
      window: 252,
      thresholds: [
        { max: -0.20, label: '베어마켓', color: '#ef4444' },
        { max: -0.10, label: '조정',     color: '#f97316' },
        { max: -0.05, label: '약세장',   color: '#fbbf24' },
        {             label: '강세장',   color: '#22c55e' },
      ],
    },
    reading: [
      '30개 대형 우량주 구성. 전통 산업·금융주 비중 높아 경기 방어주 흐름 파악에 유용.',
      '고점 대비 -10% = 조정, -20% 이상 = 베어마켓 진입.',
      'NASDAQ 대비 다우 강세 = 가치주·전통 산업주 선호 국면.',
    ],
  },

  // ──────────────────────────────────────────
  // 4. VIX 변동성 지수
  // ──────────────────────────────────────────
  {
    id: 'vix',
    title: 'VIX 변동성 지수',
    description: 'CBOE 변동성 지수 (공포 지수) - 20 이상: 불안, 30 이상: 공포',
    category: 'market',
    series: [
      {
        id: 'vix',
        label: 'VIX',
        type: 'fred',
        seriesId: 'VIXCLS',
        units: 'lin',
        color: '#f43f5e',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 15 * 60 * 1000,
    unit: '',
    format: 'number',
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 20, label: '안정', color: '#22c55e' },
        { max: 30, label: '불안', color: '#f59e0b' },
        {          label: '공포', color: '#ef4444' },
      ],
    },
    refLines: [
      { value: 20, label: '불안', color: '#fbbf24' },
      { value: 30, label: '공포', color: '#ef4444' },
    ],
    reading: [
      '20 미만 = 안정, 20~30 = 불안, 30 이상 = 공포 구간.',
      'VIX 급등 + 주가 급락 동반 = 공포 절정으로 역발상 매수 신호일 수 있음.',
      '낮은 VIX 장기 유지(과신) → 급등 전환 시 변동성 충격 주의.',
    ],
  },

  // ══════════════════════════════════════════
  // ▶ 심리/수급 (Sentiment)
  // ══════════════════════════════════════════

  // ──────────────────────────────────────────
  // 3. Fear & Greed Index (주식 시장, CNN)
  // ──────────────────────────────────────────
  {
    id: 'fear-greed-stock',
    title: 'Fear & Greed (주식)',
    description: '주식 시장 공포·탐욕 지수 (0=극도 공포, 100=극도 탐욕) | CNN — 약 1년 데이터 (CNN API 제한)',
    category: 'sentiment',
    series: [
      {
        id: 'fg-stock',
        label: 'F&G (주식/CNN)',
        type: 'static',
        file: 'cnn_fg.json',
        color: '#8b5cf6',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 25, label: '극도 공포', color: '#ef4444' },
        { max: 45, label: '공포',      color: '#f97316' },
        { max: 55, label: '중립',      color: '#eab308' },
        { max: 75, label: '탐욕',      color: '#84cc16' },
        {          label: '극도 탐욕', color: '#22c55e' },
      ],
    },
    yMin: 0,
    yMax: 100,
    bands: [
      { name: '극도 공포', min: 0,  max: 25,  color: 'rgba(239,68,68,0.12)' },
      { name: '공포',      min: 25, max: 45,  color: 'rgba(249,115,22,0.10)' },
      { name: '중립',      min: 45, max: 55,  color: 'rgba(234,179,8,0.10)' },
      { name: '탐욕',      min: 55, max: 75,  color: 'rgba(132,204,18,0.10)' },
      { name: '극도 탐욕', min: 75, max: 100, color: 'rgba(34,197,94,0.12)' },
    ],
    reading: [
      '25 이하(극도 공포) = 저점 매수 검토 신호. 75 이상(극도 탐욕) = 과열 경보.',
      '7가지 주식 시장 지표(모멘텀·VIX·풋콜비율 등) 합산. CNN 산출 기준.',
      '역발상 지표: 모두가 두려워할 때 사고, 탐욕스러울 때 팔아라.',
    ],
  },

  // ──────────────────────────────────────────
  // 4. Fear & Greed Index (크립토, alternative.me)
  // ──────────────────────────────────────────
  {
    id: 'fear-greed-crypto',
    title: 'Fear & Greed (크립토)',
    description: '암호화폐 시장 공포·탐욕 지수 (비트코인 기준) | alternative.me',
    category: 'sentiment',
    series: [
      {
        id: 'fg-crypto',
        label: 'F&G (크립토)',
        type: 'static',
        file: 'fg.json',
        color: '#f59e0b',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 30 * 60 * 1000,
    unit: '',
    format: 'number',
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 25, label: '극도 공포', color: '#ef4444' },
        { max: 45, label: '공포',      color: '#f97316' },
        { max: 55, label: '중립',      color: '#eab308' },
        { max: 75, label: '탐욕',      color: '#84cc16' },
        {          label: '극도 탐욕', color: '#22c55e' },
      ],
    },
    yMin: 0,
    yMax: 100,
    bands: [
      { name: '극도 공포', min: 0,  max: 25,  color: 'rgba(239,68,68,0.12)' },
      { name: '공포',      min: 25, max: 45,  color: 'rgba(249,115,22,0.10)' },
      { name: '중립',      min: 45, max: 55,  color: 'rgba(234,179,8,0.10)' },
      { name: '탐욕',      min: 55, max: 75,  color: 'rgba(132,204,18,0.10)' },
      { name: '극도 탐욕', min: 75, max: 100, color: 'rgba(34,197,94,0.12)' },
    ],
    reading: [
      '비트코인 기준 암호화폐 시장 심리. 주식 F&G와 독립적으로 움직임.',
      '25 이하 = 크립토 저점 매수 검토. 75 이상 = 과열, 차익실현 신호.',
      '크립토 하락장에서 장기간 극도 공포 유지는 시장 바닥권 신호.',
    ],
  },

  // ──────────────────────────────────────────
  // 4. 소비자심리지수
  // ──────────────────────────────────────────
  {
    id: 'consumer-sentiment',
    title: '소비자심리지수',
    description: '미시간대 소비자심리지수 (월별)',
    category: 'sentiment',
    series: [
      {
        id: 'umcsent',
        label: '소비자심리지수',
        type: 'fred',
        seriesId: 'UMCSENT',
        units: 'lin',
        color: '#34d399',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 65, label: '위축', color: '#ef4444' },
        { max: 80, label: '보통', color: '#f59e0b' },
        {          label: '양호', color: '#22c55e' },
      ],
    },
    reading: [
      '하락 추세 = 소비 위축 전망. 70 이하 지속 시 경기침체 우려.',
      '고용·인플레이션·금리 방향에 민감. 선행 지표로 활용.',
      '급락 후 반등 = 경기 바닥 신호일 수 있음.',
    ],
  },

  // ══════════════════════════════════════════
  // ▶ 거시경제 (Macro) — 경기 활동
  // ══════════════════════════════════════════

  // ──────────────────────────────────────────
  // 5. 실질 GDP 성장률
  // ──────────────────────────────────────────
  {
    id: 'gdp-growth',
    title: '실질 GDP 성장률',
    description: '미국 실질 GDP 전년 대비 성장률 (분기별) – 경기 확장/침체 기준선',
    category: 'macro',
    series: [
      {
        id: 'gdp',
        label: 'GDP YoY',
        type: 'fred',
        seriesId: 'GDPC1',
        units: 'pc1',
        color: '#34d399',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '%',
    format: 'percent',
    zeroLine: true,
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 0,   label: '침체', color: '#ef4444' },
        { max: 2,   label: '둔화', color: '#f97316' },
        { max: 3.5, label: '성장', color: '#22c55e' },
        {           label: '과열', color: '#f59e0b' },
      ],
    },
    reading: [
      '연속 2분기 마이너스 = 공식 경기침체 기준.',
      '2~3% = 건강한 성장. 0% 근처 = 침체 경계.',
      '분기별 발표라 후행성 강함. 다른 선행 지표와 함께 해석.',
    ],
  },

  // ──────────────────────────────────────────
  // 6. 실업률
  // ──────────────────────────────────────────
  {
    id: 'unemployment',
    title: '실업률',
    description: 'U-3 실업률 (월별)',
    category: 'macro',
    series: [
      {
        id: 'unrate',
        label: '실업률',
        type: 'fred',
        seriesId: 'UNRATE',
        units: 'lin',
        color: '#fb923c',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '%',
    format: 'percent',
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 4,   label: '완전고용', color: '#22c55e' },
        { max: 5,   label: '정상',     color: '#f59e0b' },
        {           label: '약화',     color: '#ef4444' },
      ],
    },
    reading: [
      '상승 추세 전환 시 주목. 최저점 대비 +0.5%p 이상 = Sahm Rule 침체 신호.',
      '4% 이하 = 완전고용. 5% 이상 지속 = 노동시장 약화 신호.',
      '급등 구간(코로나 등) 이후 정상화 속도가 경기 회복력을 보여줌.',
    ],
  },

  // ──────────────────────────────────────────
  // 7. 비농업 고용 변화 (NFP)
  // ──────────────────────────────────────────
  {
    id: 'nonfarm-payrolls',
    title: '비농업 고용 변화 (NFP)',
    description: '비농업 취업자수 전월 대비 변화 – 경기 강도 핵심 지표',
    category: 'macro',
    series: [
      {
        id: 'payems',
        label: 'NFP 고용 변화',
        type: 'fred',
        seriesId: 'PAYEMS',
        units: 'chg',
        color: '#10b981',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '명',
    valueMultiplier: 1000,   // FRED PAYEMS 단위: 천명 → 명 변환
    format: 'number',
    koUnit: true,
    zeroLine: true,
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 0,      label: '위축', color: '#ef4444' },
        { max: 75000,  label: '주의', color: '#f97316' },
        { max: 150000, label: '완만', color: '#f59e0b' },
        {              label: '견조', color: '#22c55e' },
      ],
    },
    reading: [
      '15만명 이상 = 건강한 고용. 마이너스 연속 = 침체 신호.',
      '전망치 대비 실제치 서프라이즈가 당일 시장 반응을 결정.',
      '코로나 이후 수치는 변동성이 크므로 3개월 추세로 판단.',
    ],
  },

  // ──────────────────────────────────────────
  // 8. JOLTS 채용공고
  // ──────────────────────────────────────────
  {
    id: 'jolts',
    title: 'JOLTS 채용공고',
    description: '미국 일자리 창출 및 이직 서베이 – 채용공고 건수 (노동 수요 지표)',
    category: 'macro',
    series: [
      {
        id: 'jolts',
        label: '채용공고',
        type: 'fred',
        seriesId: 'JTSJOL',
        units: 'lin',
        color: '#38bdf8',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '건',
    valueMultiplier: 1000,   // FRED JTSJOL 단위: 천건 → 건 변환
    format: 'number',
    koUnit: true,
    reading: [
      '채용공고 수 > 실업자 수 = 노동시장 타이트(임금 상승 압력).',
      '급감 = 기업들이 채용 수요를 줄이는 신호. 실업률 상승 선행.',
      '1,000만건 이상 = 역사적 고점(과열). 700만건 이하 = 정상화.',
    ],
  },

  // ──────────────────────────────────────────
  // 9. 초기 실업수당 청구 (Initial Jobless Claims)
  // ──────────────────────────────────────────
  {
    id: 'jobless-claims',
    title: '초기 실업수당 청구',
    description: '주간 신규 실업수당 청구 건수 – 노동시장 선행지표 (주별)',
    category: 'macro',
    series: [
      {
        id: 'icsa',
        label: '초기 실업수당',
        type: 'fred',
        seriesId: 'ICSA',
        units: 'lin',
        color: '#f59e0b',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '건',
    format: 'number',
    koUnit: true,
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 220000, label: '견조', color: '#22c55e' },
        { max: 280000, label: '주의', color: '#f59e0b' },
        {              label: '악화', color: '#ef4444' },
      ],
    },
    reading: [
      '25만건 이상 지속 = 노동시장 약화 신호. 급등 = 해고 증가.',
      '주별 발표라 경기 변화를 가장 빠르게 감지하는 지표 중 하나.',
      '4주 이동평균으로 노이즈를 제거해 추세를 파악하는 것이 효과적.',
    ],
  },

  // ══════════════════════════════════════════
  // ▶ 물가 (Inflation)
  // ══════════════════════════════════════════

  // ──────────────────────────────────────────
  // 10. CPI / 인플레이션
  // ──────────────────────────────────────────
  {
    id: 'cpi',
    title: 'CPI 인플레이션',
    description: '소비자물가지수 전년 대비 변화율 (헤드라인 + 코어)',
    category: 'macro',
    series: [
      {
        id: 'cpi',
        label: 'CPI 헤드라인',
        type: 'fred',
        seriesId: 'CPIAUCSL',
        units: 'pc1',   // YoY % change
        color: '#ef4444',
      },
      {
        id: 'core-cpi',
        label: 'Core CPI (식품·에너지 제외)',
        type: 'fred',
        seriesId: 'CPILFESL',
        units: 'pc1',
        color: '#f97316',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '%',
    format: 'percent',
    zeroLine: true,
    normalizeModes: ['raw', 'zscore'],
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 1.5, label: '디플레 우려', color: '#60a5fa' },
        { max: 2.5, label: '목표 근접',   color: '#22c55e' },
        { max: 4.0, label: '과열',        color: '#f59e0b' },
        {           label: '고물가',      color: '#ef4444' },
      ],
    },
    reading: [
      '코어(식품·에너지 제외)가 연준 판단의 핵심 지표.',
      '헤드라인 > 코어 = 에너지·식품 주도(일시적). 코어 > 헤드라인 = 구조적 인플레.',
      '2% 목표 대비 높으면 금리 인상 압력, 낮으면 인하 기대.',
    ],
  },

  // ──────────────────────────────────────────
  // 11. PCE 물가지수
  // ──────────────────────────────────────────
  {
    id: 'pce',
    title: 'PCE 물가지수',
    description: '개인소비지출 물가지수 (연준이 선호하는 물가지표)',
    category: 'macro',
    series: [
      {
        id: 'pce',
        label: 'PCE',
        type: 'fred',
        seriesId: 'PCEPI',
        units: 'pc1',
        color: '#fb7185',
      },
      {
        id: 'core-pce',
        label: 'Core PCE',
        type: 'fred',
        seriesId: 'PCEPILFE',
        units: 'pc1',
        color: '#fda4af',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '%',
    format: 'percent',
    normalizeModes: ['raw', 'zscore'],
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 1.5, label: '디플레 우려', color: '#60a5fa' },
        { max: 2.5, label: '목표 근접',   color: '#22c55e' },
        { max: 4.0, label: '과열',        color: '#f59e0b' },
        {           label: '고물가',      color: '#ef4444' },
      ],
    },
    reading: [
      '연준의 공식 물가 목표 지표(CPI보다 중시). 코어 PCE 2% = 금리 결정 기준.',
      'CPI보다 낮게 측정되는 경향. 소비 바구니 구성·가중치가 다름.',
      '코어 PCE 지속 상승 = 금리 인하 지연 신호.',
    ],
  },

  // ──────────────────────────────────────────
  // 12. 10년 기대인플레이션 (BEI)
  // ──────────────────────────────────────────
  {
    id: 'inflation-expectation',
    title: '10년 기대인플레이션 (BEI)',
    description: '10년물 TIPS 손익분기 인플레이션율 – 시장이 예상하는 향후 10년 평균 물가',
    category: 'macro',
    series: [
      {
        id: 't10yie',
        label: '10Y 기대인플레이션',
        type: 'fred',
        seriesId: 'T10YIE',
        units: 'lin',
        color: '#fb7185',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '%',
    format: 'percent',
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 1.8, label: '디플레 우려', color: '#60a5fa' },
        { max: 2.5, label: '안정',        color: '#22c55e' },
        {           label: '기대 고착',   color: '#f59e0b' },
      ],
    },
    refLines: [
      { value: 2, label: 'Fed 목표 2%', color: '#22c55e' },
    ],
    reading: [
      '2% 근처 = 시장이 연준 목표를 신뢰. 2.5% 초과 지속 = 인플레 기대 고착화 우려.',
      '상승 = 실질금리 하락 압력(금·주가에 우호). 하락 = 디플레이션 우려.',
      'TIPS와 국채 수익률 차이로 계산. 연준의 신뢰도 바로미터.',
    ],
  },

  // ══════════════════════════════════════════
  // ▶ 금리 (Rates)
  // ══════════════════════════════════════════

  // ──────────────────────────────────────────
  // 13. 연방기금금리 (Fed Funds Rate)
  // ──────────────────────────────────────────
  {
    id: 'fed-rate',
    title: '연방기금금리',
    description: 'Federal Funds Rate (FOMC 금리 결정)',
    category: 'rates',
    series: [
      {
        id: 'fedfunds',
        label: '연방기금금리',
        type: 'fred',
        seriesId: 'FEDFUNDS',
        units: 'lin',
        color: '#22c55e',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '%',
    format: 'percent',
    reading: [
      '인상 = 긴축(주가·채권 하락 압력). 인하 = 완화(위험자산 선호).',
      '현재 사이클 방향(인상/동결/인하)과 속도가 핵심.',
      '시장은 FOMC 결정 전부터 선반영. 금리 선물 시장 확인 병행 추천.',
    ],
  },

  // ──────────────────────────────────────────
  // 14. 미국채 수익률 (2Y / 10Y)
  // ──────────────────────────────────────────
  {
    id: 'treasury-yields',
    title: '미국채 수익률',
    description: '2년물·10년물 국채 수익률',
    category: 'rates',
    series: [
      {
        id: 'dgs2',
        label: '2년물',
        type: 'fred',
        seriesId: 'DGS2',
        units: 'lin',
        color: '#38bdf8',
      },
      {
        id: 'dgs10',
        label: '10년물',
        type: 'fred',
        seriesId: 'DGS10',
        units: 'lin',
        color: '#818cf8',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '%',
    format: 'percent',
    normalizeModes: ['raw', 'zscore'],
    reading: [
      '2년물 = 금리 정책 민감. 10년물 = 장기 경기 기대치 반영.',
      '10Y > 2Y = 정상적 우상향 곡선. 역전 = 침체 선행 신호.',
      '두 선이 가까워지는(평탄화) 구간이 역전 전 경고 단계.',
    ],
  },

  // ──────────────────────────────────────────
  // 15. 장단기 금리차 (10Y - 2Y)
  // ──────────────────────────────────────────
  {
    id: 'yield-spread',
    title: '장단기 금리차 (10Y-2Y)',
    description: '미국채 수익률 역전: 음수 → 경기침체 선행지표',
    category: 'rates',
    series: [
      {
        id: 'spread',
        label: '10Y-2Y 스프레드',
        type: 'fred',
        seriesId: 'T10Y2Y',
        units: 'lin',
        color: '#06b6d4',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '%p',
    format: 'percent',
    zeroLine: true,
    recessionShading: true,
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 0,   label: '역전',      color: '#ef4444' },
        { max: 0.5, label: '정상화 중', color: '#f59e0b' },
        {           label: '정상',      color: '#22c55e' },
      ],
    },
    reading: [
      '음수(역전) = 과거 7번 연속 침체 선행. 신뢰도 높은 경기침체 예측 지표.',
      '역전 지속 기간이 길수록 침체 심도가 깊은 경향.',
      '역전 해소(양전환) 직후 실제 침체가 시작되는 패턴을 보임.',
    ],
  },

  // ──────────────────────────────────────────
  // 16. 장단기 금리차 (10Y-3M) – 경기침체 최고 예측 지표
  // ──────────────────────────────────────────
  {
    id: 'yield-spread-10y3m',
    title: '금리차 (10Y-3M)',
    description: '10년-3개월 국채 금리차: 역전 시 12~18개월 후 침체 예측 (뉴욕연준 모델)',
    category: 'rates',
    series: [
      {
        id: 't10y3m',
        label: '10Y-3M 스프레드',
        type: 'fred',
        seriesId: 'T10Y3M',
        units: 'lin',
        color: '#a78bfa',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '%p',
    format: 'percent',
    zeroLine: true,
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 0,   label: '역전',      color: '#ef4444' },
        { max: 0.5, label: '정상화 중', color: '#f59e0b' },
        {           label: '정상',      color: '#22c55e' },
      ],
    },
    reading: [
      '뉴욕 연준 침체 예측 모델의 핵심 변수. 10Y-2Y보다 예측력 높다고 평가.',
      '역전 후 12~18개월 내 침체 확률 급상승.',
      '역전 해소 시점이 실제 침체 시작과 근접하는 경향.',
    ],
  },

  // ──────────────────────────────────────────
  // 17. 30년물 국채 수익률
  // ──────────────────────────────────────────
  {
    id: 'treasury-30y',
    title: '30년물 국채 수익률',
    description: '미국채 30년물 수익률 – 장기 인플레이션 기대 및 모기지 금리 연동',
    category: 'rates',
    series: [
      {
        id: 'dgs30',
        label: '30년물',
        type: 'fred',
        seriesId: 'DGS30',
        units: 'lin',
        color: '#c084fc',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '%',
    format: 'percent',
    reading: [
      '30년물은 시장의 장기 인플레이션 기대와 성장 전망을 가장 잘 반영.',
      '모기지 금리(30년 고정)와 연동 → 주택 시장에 직접 영향.',
      '10Y 대비 30Y가 높으면 장기 인플레 우려, 낮으면 성장 둔화 우려 신호.',
    ],
  },

  // ──────────────────────────────────────────
  // 18. 하이일드 스프레드 (HY OAS)
  // ──────────────────────────────────────────
  {
    id: 'hy-spread',
    title: '하이일드 스프레드 (HY OAS)',
    description: 'ICE BofA 미국 고수익채 OAS – 스프레드 확대 → 신용 위기 선행지표',
    category: 'rates',
    series: [
      {
        id: 'hyspread',
        label: 'HY OAS 스프레드',
        type: 'fred',
        seriesId: 'BAMLH0A0HYM2',
        units: 'lin',
        color: '#f97316',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '%',
    format: 'percent',
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 4, label: '안정', color: '#22c55e' },
        { max: 7, label: '주의', color: '#f59e0b' },
        {         label: '위기', color: '#ef4444' },
      ],
    },
    refLines: [
      { value: 4,  label: '주의(4%)',  color: '#fbbf24' },
      { value: 7,  label: '위기(7%)',  color: '#ef4444' },
    ],
    reading: [
      '국채 대비 정크본드 금리 차이. 확대 = 투자자들이 리스크 회피 중.',
      '4% 이상 = 신용 경계. 7% 이상 = 금융 위기 수준(2008, 2020 참고).',
      '주가 하락 선행하는 경우 많음. S&P 500 vs HY 스프레드 차트와 함께 볼 것.',
    ],
  },

  // ══════════════════════════════════════════
  // ▶ 유동성 & 원자재 (Liquidity & Commodities)
  // ══════════════════════════════════════════

  // ──────────────────────────────────────────
  // 18. M2 통화량 (전년 대비)
  // ──────────────────────────────────────────
  {
    id: 'm2',
    title: 'M2 통화량 증가율',
    description: 'M2 통화량 전년 대비 변화율 (유동성 지표) | WM2NS 주간 비계절조정 — M2SL 월간 대비 약 2~3주 빠른 데이터',
    category: 'macro',
    series: [
      {
        id: 'm2',
        label: 'M2 YoY',
        type: 'fred',
        seriesId: 'WM2NS',
        units: 'pc1',
        color: '#a855f7',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '%',
    format: 'percent',
    zeroLine: true,
    statusConfig: {
      type: 'threshold',
      thresholds: [
        { max: 0,  label: '역성장', color: '#ef4444' },
        { max: 5,  label: '둔화',   color: '#f59e0b' },
        { max: 10, label: '정상',   color: '#22c55e' },
        {          label: '급증',   color: '#60a5fa' },
      ],
    },
    reading: [
      'M2 증가 = 유동성 확대(주가 상승 동력). 감소·마이너스 = 유동성 회수.',
      '주가에 약 6~12개월 선행하는 경향. M2 감소 후 주가 조정 패턴 관찰.',
      '마이너스 M2는 역사적으로 매우 드문 현상. 최근 구간 주목.',
    ],
  },

  // ──────────────────────────────────────────
  // 19. 달러 지수 (DXY)
  // ──────────────────────────────────────────
  {
    id: 'dollar-index',
    title: '달러 지수 (Broad)',
    description: '연준 Nominal Broad Dollar Index — DTWEXBGS (26개국 통화 가중) | ※ 흔히 말하는 DXY(ICE 6개국)와 다른 지수',
    category: 'market',
    series: [
      {
        id: 'dxy',
        label: '달러 지수',
        type: 'fred',
        seriesId: 'DTWEXBGS',
        units: 'lin',
        color: '#22d3ee',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    reading: [
      '강달러 = 신흥국 자금 이탈, 원자재 하락, 미국 수출기업 실적 악화.',
      '약달러 = 글로벌 위험자산 선호, 원자재·신흥국 주가 상승.',
      '※ DTWEXBGS는 26개국 기준 연준 지수. 흔히 말하는 DXY(ICE 6개국)와 수치 다름.',
    ],
  },

  // ──────────────────────────────────────────
  // 20. WTI 원유 가격
  // ──────────────────────────────────────────
  {
    id: 'wti-oil',
    title: 'WTI 원유 가격',
    description: '서부 텍사스산 중질유(WTI) 현물 가격 (경기 수요·인플레이션 선행지표)',
    category: 'commodity',
    series: [
      {
        id: 'wti',
        label: 'WTI 원유',
        type: 'fred',
        seriesId: 'DCOILWTICO',
        units: 'lin',
        color: '#84cc16',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: 'USD/bbl',
    format: 'number',
    reading: [
      '$60 이하 = 수요 우려(경기 둔화). $100 이상 = 인플레이션 압력 및 소비 위축.',
      '공급 충격(OPEC 감산·지정학)과 수요 신호를 구분해 해석.',
      '원유 급등은 CPI 헤드라인을 밀어올려 금리 인하를 제약.',
    ],
  },

  // ──────────────────────────────────────────
  // 21. 금 가격
  // ──────────────────────────────────────────
  {
    id: 'gold-price',
    title: '금 가격',
    description: '금 선물 현물 환산가 (USD/트로이온스) – 안전자산·인플레이션 헤지 대표 지표 | 출처: Yahoo Finance GC=F',
    category: 'commodity',
    series: [
      {
        id: 'gold',
        label: '금 가격',
        type: 'static',
        file: 'gold.json',
        color: '#fbbf24',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: 'USD/oz',
    format: 'number',
    reading: [
      '달러 약세·실질금리 하락·지정학 리스크 고조 시 상승 경향.',
      '주가 급락 구간에서 금이 오르면 안전자산 선호 확인. 동반 하락이면 마진콜 청산.',
      '금 가격 ÷ S&P 500 비율로 위험자산 대비 안전자산 선호도 파악 가능.',
    ],
  },

  // ──────────────────────────────────────────
  // 22. 은 가격
  // ──────────────────────────────────────────
  {
    id: 'silver-price',
    title: '은 가격',
    description: '은 선물 현물 환산가 (USD/트로이온스) – 산업·귀금속 이중 성격 | 출처: Yahoo Finance SI=F',
    category: 'commodity',
    series: [
      {
        id: 'silver',
        label: '은 가격',
        type: 'static',
        file: 'silver.json',
        color: '#94a3b8',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: 'USD/oz',
    format: 'number',
    reading: [
      '금·은 비율(Gold/Silver Ratio)이 80 이상이면 역사적으로 은이 저평가된 구간.',
      '은은 산업 수요(태양광·전자 등) 비중이 높아 경기 둔화 시 금보다 더 하락하는 경향.',
      '귀금속 랠리에서 은이 금보다 늦게, 그러나 더 강하게 상승하는 패턴 자주 관찰됨.',
    ],
  },

  // ──────────────────────────────────────────
  // 23. 천연가스 가격 (Henry Hub)
  // ──────────────────────────────────────────
  {
    id: 'natural-gas',
    title: '천연가스 가격 (Henry Hub)',
    description: 'Henry Hub 천연가스 현물 가격 – 에너지 비용·계절성 인플레이션 지표',
    category: 'commodity',
    series: [
      {
        id: 'natgas',
        label: '천연가스',
        type: 'fred',
        seriesId: 'DHHNGSP',
        units: 'lin',
        color: '#34d399',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: 'USD/MMBtu',
    format: 'number',
    reading: [
      '겨울철 수요·이상 기온에 극도로 민감. 계절성이 강해 YoY 비교가 중요.',
      '천연가스 급등 = 전력·난방 비용 상승 → CPI 에너지 항목 압박.',
      '미국 LNG 수출 확대로 유럽 가스 가격과 상관관계 증가 중.',
    ],
  },

  // ──────────────────────────────────────────
  // 23. 구리 가격 (Dr. Copper)
  // ──────────────────────────────────────────
  {
    id: 'copper-price',
    title: '구리 가격 (Dr. Copper)',
    description: 'IMF 글로벌 구리 가격 – 경제 활동 선행지표 (경기 확장 시 수요 증가)',
    category: 'commodity',
    series: [
      {
        id: 'copper',
        label: '구리 가격',
        type: 'fred',
        seriesId: 'PCOPPUSDM',
        units: 'lin',
        color: '#fb923c',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: 'USD/mt',
    format: 'number',
    reading: [
      'Dr. Copper: 전기차·건설·인프라 수요에 민감해 경기 선행성 높음.',
      '상승 = 글로벌 제조업 확장. 하락 = 경기 둔화, 특히 중국 경기 반영.',
      '최근 급등은 AI 데이터센터·에너지전환 수요와 공급 부족이 복합 작용.',
    ],
  },

  // ──────────────────────────────────────────
  // 22. 케이스-실러 주택가격지수
  // ──────────────────────────────────────────
  {
    id: 'housing-price',
    title: '주택가격지수 (Case-Shiller)',
    description: 'S&P 케이스-실러 미국 전국 주택가격지수 (소비·자산효과·인플레이션 연관)',
    category: 'macro',
    series: [
      {
        id: 'housing',
        label: '주택가격지수',
        type: 'fred',
        seriesId: 'CSUSHPINSA',
        units: 'lin',
        color: '#a78bfa',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    reading: [
      '상승 = 자산효과(가계 부 증가 → 소비 확대). 금리 인상 후 하락은 6~18개월 시차.',
      '급락 = 담보 가치 하락 → 금융 시스템 리스크(2008 서브프라임 참고).',
      '지수 고점 대비 -15% 이상 = 주택 시장 조정 신호.',
    ],
  },

  // ══════════════════════════════════════════
  // ▶ 환율 (Forex)
  // ══════════════════════════════════════════

  // ──────────────────────────────────────────
  // 원/달러 환율 (USD/KRW)
  // ──────────────────────────────────────────
  {
    id: 'usd-krw',
    title: '원/달러 환율',
    description: '달러 대비 원화 환율 (수치 상승 = 원화 약세) | Yahoo Finance USDKRW=X · 전일 종가',
    category: 'forex',
    series: [
      {
        id: 'usdkrw',
        label: '원/달러',
        type: 'static',
        file: 'yahoo_usdkrw.json',
        color: '#22d3ee',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '₩/$',
    format: 'number',
    reading: [
      '원화 약세(수치↑) = 수출 기업 유리, 수입 물가 상승, 외국인 자금 이탈 신호.',
      '1,300원 이상 고착 = 원화 약세 구조화. 1,200원 이하 = 원화 강세 안정 국면.',
      '달러 강세·글로벌 위기 시 원화는 신흥국 통화 중 변동성이 큰 편.',
    ],
  },

  // ──────────────────────────────────────────
  // 원/엔 환율 (KRW/JPY)
  // ──────────────────────────────────────────
  {
    id: 'krw-jpy',
    title: '원/엔 환율',
    description: '100엔당 원화 환율 (수치 상승 = 원화 약세 / 엔 강세) | USDKRW=X ÷ USDJPY=X × 100 · 전일 종가',
    category: 'forex',
    series: [
      {
        id: 'krwjpy',
        label: '원/엔 (100엔)',
        type: 'static',
        file: 'krwjpy.json',
        color: '#fb923c',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '₩/¥100',
    format: 'number',
    reading: [
      '100엔당 원화 기준. 수치 상승 = 원화 약세(엔 대비), 하락 = 원화 강세.',
      '일본과 교역·관광 의존도가 높아 원/엔 환율은 한국 경제에 직접 영향.',
      '800원대 이하 = 엔화 약세 극단 구간. 엔화 반등 시 원화도 동반 영향.',
    ],
  },

  // ──────────────────────────────────────────
  // USD/JPY 환율
  // ──────────────────────────────────────────
  {
    id: 'usd-jpy',
    title: 'USD/JPY 환율',
    description: '달러 대비 엔화 환율 (수치 상승 = 엔 약세) – 캐리 트레이드·위험 선호 바로미터 | Yahoo Finance USDJPY=X · 전일 종가',
    category: 'forex',
    series: [
      {
        id: 'usdjpy',
        label: 'USD/JPY',
        type: 'static',
        file: 'yahoo_usdjpy.json',
        color: '#f43f5e',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '¥/$',
    format: 'number',
    reading: [
      '엔 약세(수치↑) = 글로벌 위험 선호, 캐리 트레이드 활성화. 엔 강세(수치↓) = 리스크 오프, 캐리 청산.',
      '일본은행(BOJ) 금리 인상 시 엔 강세 압력 → 글로벌 자산 변동성 증폭 가능.',
      '엔화 급격한 강세 전환은 과거 글로벌 위험자산 동반 하락의 전조.',
    ],
  },

  // ──────────────────────────────────────────
  // EUR/USD 환율
  // ──────────────────────────────────────────
  {
    id: 'eur-usd',
    title: 'EUR/USD 환율',
    description: '유로 대비 달러 환율 (수치 하락 = 달러 강세) – Fed vs ECB 정책 차이 반영 | Yahoo Finance EURUSD=X · 전일 종가',
    category: 'forex',
    series: [
      {
        id: 'eurusd',
        label: 'EUR/USD',
        type: 'static',
        file: 'yahoo_eurusd.json',
        color: '#818cf8',
        areaStyle: true,
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '$/€',
    format: 'number',
    reading: [
      '달러 강세(수치↓) = 글로벌 위험 회피, 신흥국 자금 이탈. 달러 약세(수치↑) = 위험 선호.',
      'Fed 금리 > ECB 금리 → 달러 강세 압력. 격차 축소 시 달러 약세 전환 경향.',
      '1.00 하회(달러 패리티) = 유럽 경기 위기 신호. 역사적으로 드문 구간.',
    ],
  },

  // ══════════════════════════════════════════
  // ▶ S&P 500 비교 차트
  // ══════════════════════════════════════════

  // ──────────────────────────────────────────
  // 23. S&P 500 vs VIX
  // ──────────────────────────────────────────
  {
    id: 'sp500-vix',
    title: 'S&P 500 vs VIX',
    description: 'S&P 500과 변동성(공포) 지수의 역상관 관계',
    category: 'market',
    series: [
      {
        id: 'sp500',
        label: 'S&P 500',
        type: 'fred',
        seriesId: 'SP500',
        units: 'lin',
        color: '#3b82f6',
      },
      {
        id: 'vix',
        label: 'VIX (공포지수)',
        type: 'fred',
        seriesId: 'VIXCLS',
        units: 'lin',
        color: '#f43f5e',
      },
    ],
    defaultNormalize: 'raw',         // 이중축: 각각 다른 스케일 독립 표시
    updateInterval: 15 * 60 * 1000,
    unit: '',
    format: 'number',
    normalizeModes: ['raw', 'zscore', 'pct'],
    reading: [
      '역상관 관계 확인용. 주가 하락 시 VIX 급등이 정상 패턴.',
      'VIX 급등 + 주가 급락 동반 = 공포 절정. 이후 반등 가능성 검토.',
      '두 선이 같은 방향 상승 = 이상 신호. 추가 확인 필요.',
    ],
  },

  // ──────────────────────────────────────────
  // 24. S&P 500 + 마진 부채
  // ──────────────────────────────────────────
  {
    id: 'sp500-margin',
    title: 'S&P 500 & 마진 부채',
    description: 'S&P 500 vs FINRA 마진 부채 (수급 과열 지표)',
    category: 'market',
    series: [
      {
        id: 'sp500',
        label: 'S&P 500',
        type: 'fred',
        seriesId: 'SP500',
        units: 'lin',
        color: '#3b82f6',
      },
      {
        id: 'margin',
        label: '마진 부채',
        type: 'static',
        file: 'finra_margin.json',
        color: '#f59e0b',
      },
    ],
    defaultNormalize: 'raw',         // 이중축: S&P500(좌) vs 마진부채(우)
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    normalizeModes: ['raw', 'zscore', 'pct'],
    reading: [
      '마진 부채 급증 + 주가 급등 = 레버리지 과열. 조정 취약성 증가.',
      '마진 부채가 먼저 꺾이고 주가가 뒤따르는 선행 패턴 관찰.',
      '%변화 모드로 보면 두 지표의 동조·이탈 시점을 더 명확히 파악 가능.',
    ],
  },

  // ──────────────────────────────────────────
  // 25. S&P 500 vs P/E Ratio (Shiller)
  // ──────────────────────────────────────────
  {
    id: 'sp500-pe',
    title: 'S&P 500 vs P/E Ratio',
    description: '주가수익비율 (Price / 12개월 Trailing Earnings) | 출처: Robert Shiller, Yale — 2020년 EPS 급감 구간 y축 100 캡',
    category: 'market',
    series: [
      {
        id: 'sp500',
        label: 'S&P 500',
        type: 'fred',
        seriesId: 'SP500',
        units: 'lin',
        color: '#3b82f6',
      },
      {
        id: 'pe',
        label: 'P/E Ratio',
        type: 'static',
        file: 'shiller_pe_ratio.json',
        color: '#f59e0b',
      },
    ],
    defaultNormalize: 'raw',         // 이중축: 스케일이 다른 두 지표 비교
    defaultRange: 'MAX',              // Shiller P/E 데이터 2023년까지 → MAX로 전체 표시
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    normalizeModes: ['raw', 'zscore', 'pct'],
    yMaxRight: 100,                   // 2020 EPS 급감으로 P/E 수백배 스파이크 → 100 캡
    reading: [
      'P/E 20 이하 = 저평가. 25 이상 = 고평가. 역사적 평균 ~16배.',
      '주가↑ + P/E↓ = 이익 성장이 주도하는 건강한 상승.',
      '주가↑ + P/E↑ = 멀티플 확장(기대 선반영). 이익 뒷받침 없으면 버블 위험.',
    ],
  },

  // ──────────────────────────────────────────
  // 26. S&P 500 vs Shiller CAPE
  // ──────────────────────────────────────────
  {
    id: 'sp500-cape',
    title: 'S&P 500 vs Shiller CAPE',
    description: '경기조정 주가수익비율 (10년 실질이익 기준 P/E) | 출처: Robert Shiller, Yale',
    category: 'market',
    series: [
      {
        id: 'sp500',
        label: 'S&P 500',
        type: 'fred',
        seriesId: 'SP500',
        units: 'lin',
        color: '#3b82f6',
      },
      {
        id: 'cape',
        label: 'Shiller CAPE',
        type: 'static',
        file: 'shiller_cape.json',
        color: '#e879f9',
      },
    ],
    defaultNormalize: 'raw',
    defaultRange: 'MAX',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    normalizeModes: ['raw', 'zscore', 'pct'],
    reading: [
      '10년 실질이익 기준. 역사적 평균 ~17배. 30 이상 = 고평가 구간.',
      '단기 예측보다 향후 7~10년 수익률 예측에 유용한 장기 지표.',
      '현재 CAPE가 높아도 유동성·저금리 환경에선 정당화되는 경향.',
    ],
  },

  // ──────────────────────────────────────────
  // 27. S&P 500 vs M2 통화량
  // ──────────────────────────────────────────
  {
    id: 'sp500-m2',
    title: 'S&P 500 vs M2 통화량',
    description: '주가와 통화량의 상관관계 (유동성 장세 분석)',
    category: 'market',
    series: [
      {
        id: 'sp500',
        label: 'S&P 500',
        type: 'fred',
        seriesId: 'SP500',
        units: 'lin',
        color: '#3b82f6',
      },
      {
        id: 'm2',
        label: 'M2 통화량',
        type: 'fred',
        seriesId: 'M2SL',
        units: 'lin',
        color: '#a855f7',
      },
    ],
    defaultNormalize: 'raw',         // 이중축: M2 절대값(좌) vs S&P500(우)
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    normalizeModes: ['raw', 'zscore', 'pct'],
    reading: [
      'M2 급증 후 주가 상승 시차 확인. 유동성이 주가를 밀어올리는 패턴.',
      'M2 감소 구간에서 주가가 버티면 → 과열 또는 이익 주도 상승.',
      '%변화 모드로 전환하면 두 지표의 성장률 괴리를 직관적으로 파악 가능.',
    ],
  },

  // ──────────────────────────────────────────
  // 28. S&P 500 vs 달러 지수
  // ──────────────────────────────────────────
  {
    id: 'sp500-dxy',
    title: 'S&P 500 vs 달러 지수',
    description: '주가와 달러의 역상관 관계 (달러 강세 → 주가 하락 압력)',
    category: 'market',
    series: [
      {
        id: 'sp500',
        label: 'S&P 500',
        type: 'fred',
        seriesId: 'SP500',
        units: 'lin',
        color: '#3b82f6',
      },
      {
        id: 'dxy',
        label: '달러 지수',
        type: 'fred',
        seriesId: 'DTWEXBGS',
        units: 'lin',
        color: '#22d3ee',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    normalizeModes: ['raw', 'zscore', 'pct'],
    reading: [
      '일반적 역상관. 강달러 지속 시 외국인 자금 이탈 → 주가 하락 압력.',
      '달러 강세 + 주가 동반 상승 = 미국 예외주의. 괴리 지속 시 방향 전환 주의.',
      '달러 약세 전환 = 신흥국·원자재 동반 상승 신호로 연결되는 경우 많음.',
    ],
  },

  // ──────────────────────────────────────────
  // 29. S&P 500 vs HY 스프레드
  // ──────────────────────────────────────────
  {
    id: 'sp500-hyspread',
    title: 'S&P 500 vs HY 스프레드',
    description: '주가와 신용 스프레드 역상관 – 스프레드 확대 시 시장 위험 신호',
    category: 'market',
    series: [
      {
        id: 'sp500',
        label: 'S&P 500',
        type: 'fred',
        seriesId: 'SP500',
        units: 'lin',
        color: '#3b82f6',
      },
      {
        id: 'hyspread',
        label: 'HY 스프레드',
        type: 'fred',
        seriesId: 'BAMLH0A0HYM2',
        units: 'lin',
        color: '#f97316',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    normalizeModes: ['raw', 'zscore', 'pct'],
    reading: [
      '스프레드 확대 + 주가 하락 = 신용 위험이 주식 시장으로 전이되는 신호.',
      '주가 상승 중 스프레드도 확대 = 경보. 주식 시장 균열 선행 지표.',
      '스프레드 정상화(축소) 없이 주가만 회복 = 지속성 의문. 확인 필요.',
    ],
  },

  // ──────────────────────────────────────────
  // 30. S&P 500 vs 10년물 금리
  // ──────────────────────────────────────────
  {
    id: 'sp500-10y',
    title: 'S&P 500 vs 10년물 금리',
    description: 'S&P 500 대비 미국채 10년물 수익률 – 금리 상승 시 주가 밸류에이션 압박',
    category: 'market',
    series: [
      {
        id: 'sp500',
        label: 'S&P 500',
        type: 'fred',
        seriesId: 'SP500',
        units: 'lin',
        color: '#3b82f6',
      },
      {
        id: 'dgs10',
        label: '10년물 금리',
        type: 'fred',
        seriesId: 'DGS10',
        units: 'lin',
        color: '#818cf8',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    normalizeModes: ['raw', 'zscore', 'pct'],
    reading: [
      '10년물 금리 급등 → 할인율 상승 → 성장주 밸류에이션 압박(역상관).',
      '금리 4~5% 이상 구간에서 주식 대비 채권 매력도 상승 → 자금 이동 우려.',
      '금리↑ + 주가↑ 동반 = 경기 과열. 금리↑ + 주가↓ = 긴축 충격.',
    ],
  },

  // ──────────────────────────────────────────
  // 31. S&P 500 vs 연방기금금리
  // ──────────────────────────────────────────
  {
    id: 'sp500-fedfunds',
    title: 'S&P 500 vs 연방기금금리',
    description: 'S&P 500 대비 기준금리 – 금리 인상/인하 사이클과 주가 흐름',
    category: 'market',
    series: [
      {
        id: 'sp500',
        label: 'S&P 500',
        type: 'fred',
        seriesId: 'SP500',
        units: 'lin',
        color: '#3b82f6',
      },
      {
        id: 'fedfunds',
        label: '연방기금금리',
        type: 'fred',
        seriesId: 'FEDFUNDS',
        units: 'lin',
        color: '#22c55e',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    normalizeModes: ['raw', 'zscore', 'pct'],
    reading: [
      '금리 인상 사이클 초반 = 주가 버팀. 후반 고금리 지속 = 주가 피크 형성 경향.',
      '첫 번째 금리 인하 = 단기 반등 후 경기침체 확인 시 재하락 패턴 반복.',
      '역사적으로 "금리 인하 = 주가 호재"는 통하지 않음. 인하 이유가 중요.',
    ],
  },

  // ──────────────────────────────────────────
  // 32. S&P 500 vs 장단기 금리차
  // ──────────────────────────────────────────
  {
    id: 'sp500-yield-spread',
    title: 'S&P 500 vs 장단기 금리차',
    description: 'S&P 500 대비 10Y-2Y 금리차 – 수익률 곡선 역전과 주가 꺾임 시점',
    category: 'market',
    series: [
      {
        id: 'sp500',
        label: 'S&P 500',
        type: 'fred',
        seriesId: 'SP500',
        units: 'lin',
        color: '#3b82f6',
      },
      {
        id: 'spread',
        label: '10Y-2Y 금리차',
        type: 'fred',
        seriesId: 'T10Y2Y',
        units: 'lin',
        color: '#06b6d4',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    normalizeModes: ['raw', 'zscore', 'pct'],
    reading: [
      '금리차 역전(음수) 구간에서 주가는 단기 유지되다 이후 급락하는 패턴.',
      '역전 해소(양전환) 시점이 실제 침체·주가 하락 시작과 근접하는 경향.',
      '역전 지속 기간이 길수록 이후 주가 조정 폭이 큰 경향 있음.',
    ],
  },

  // ──────────────────────────────────────────
  // S&P 500 vs 금
  // ──────────────────────────────────────────
  {
    id: 'sp500-gold',
    title: 'S&P 500 vs 금',
    description: '위험자산(주식) 대비 안전자산(금)의 방향 – 시장 심리 판독 지표',
    category: 'market',
    series: [
      {
        id: 'sp500',
        label: 'S&P 500',
        type: 'fred',
        seriesId: 'SP500',
        units: 'lin',
        color: '#3b82f6',
      },
      {
        id: 'gold',
        label: '금 가격',
        type: 'static',
        file: 'gold.json',
        color: '#fbbf24',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    normalizeModes: ['raw', 'zscore', 'pct'],
    reading: [
      '주가↑ + 금↑ 동반 = 유동성 과잉 또는 인플레 헤지. 주가↓ + 금↑ = 전형적 안전자산 선호.',
      '주가 급락 시 금이 버티거나 오르면 위기 성격. 금도 같이 떨어지면 마진콜 청산 성격.',
      '%변화 모드로 전환하면 위험자산·안전자산 간 성과 격차 추세를 한눈에 확인 가능.',
    ],
  },

  // ──────────────────────────────────────────
  // 33. S&P 500 vs WTI 원유
  // ──────────────────────────────────────────
  {
    id: 'sp500-wti',
    title: 'S&P 500 vs WTI 원유',
    description: 'S&P 500 대비 WTI 원유 가격 – 경기 동반 지표 vs 비용 충격',
    category: 'market',
    series: [
      {
        id: 'sp500',
        label: 'S&P 500',
        type: 'fred',
        seriesId: 'SP500',
        units: 'lin',
        color: '#3b82f6',
      },
      {
        id: 'wti',
        label: 'WTI 원유',
        type: 'fred',
        seriesId: 'DCOILWTICO',
        units: 'lin',
        color: '#84cc16',
      },
    ],
    defaultNormalize: 'raw',
    updateInterval: 24 * 60 * 60 * 1000,
    unit: '',
    format: 'number',
    normalizeModes: ['raw', 'zscore', 'pct'],
    reading: [
      '경기 확장기: 원유·주가 동반 상승(수요 증가 반영). 동반 하락 = 수요 붕괴.',
      '원유 급등(공급 충격) + 주가 하락 = 스태그플레이션 우려 신호.',
      '%변화 모드로 비교 시 원유가 주가에 선행하는 구간을 파악할 수 있음.',
    ],
  },
];
