// ============================================================
// config.js - 대시보드 설정
// 데이터는 GitHub Actions에서 data/ 폴더에 정적 파일로 업데이트됩니다.
// ============================================================

const CONFIG = {
  // 기본 기간 (1M | 3M | 6M | 1Y | 3Y | 5Y | MAX)
  DEFAULT_RANGE: '1Y',

  // 기본 데이터 시작 날짜 (MAX 범위)
  DATA_START: '2000-01-01',
};

// ============================================================
// 차트 카테고리 정의
// ============================================================
const CATEGORIES = {
  market:    { label: '시장',     color: '#3b82f6' },
  sentiment: { label: '심리/수급', color: '#8b5cf6' },
  rates:     { label: '금리',     color: '#06b6d4' },
  macro:     { label: '거시경제', color: '#22c55e' },
  commodity: { label: '원자재',   color: '#f59e0b' },
  forex:     { label: '환율',     color: '#f43f5e' },
};

// ============================================================
// 기간 범위 → 시작 날짜 변환
// ============================================================
function getRangeStartDate(range) {
  const now = new Date();
  const map = {
    '1M':  new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
    '3M':  new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
    '6M':  new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
    '1Y':  new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
    '3Y':  new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()),
    '5Y':  new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()),
    'MAX': new Date(CONFIG.DATA_START),
  };
  const d = map[range] || map['1Y'];
  return d.toISOString().split('T')[0];
}
