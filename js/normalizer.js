// ============================================================
// normalizer.js - 데이터 정규화 유틸리티
// 여러 지표를 같은 차트에 표시할 때 스케일 조정
// ============================================================

const Normalizer = {
  /**
   * Z-Score 정규화: (x - mean) / std
   * 모든 시리즈를 평균 0, 표준편차 1 스케일로 변환
   */
  zScore(values) {
    const clean = values.filter(v => v !== null && !isNaN(v));
    if (clean.length === 0) return values;
    const mean = clean.reduce((a, b) => a + b, 0) / clean.length;
    const std = Math.sqrt(clean.reduce((a, b) => a + (b - mean) ** 2, 0) / clean.length);
    if (std === 0) return values.map(v => v === null ? null : 0);
    return values.map(v => v === null ? null : Math.round((v - mean) / std * 1000) / 1000);
  },

  /**
   * % 변화율: 기준점 대비 누적 변화율
   * @param {number[]} values
   * @param {number} baseIndex - 기준 인덱스 (기본: 첫 번째 유효값)
   */
  pctChange(values, baseIndex = -1) {
    const firstValidIdx = baseIndex >= 0 ? baseIndex :
      values.findIndex(v => v !== null && !isNaN(v) && v !== 0);
    if (firstValidIdx < 0) return values;
    const base = values[firstValidIdx];
    if (!base || base === 0) return values;
    return values.map(v => v === null ? null : Math.round((v / base - 1) * 10000) / 100);
  },

  /**
   * Min-Max 정규화: 0~100 스케일
   */
  minMax(values) {
    const clean = values.filter(v => v !== null && !isNaN(v));
    if (clean.length === 0) return values;
    const min = Math.min(...clean);
    const max = Math.max(...clean);
    if (max === min) return values.map(v => v === null ? null : 50);
    return values.map(v => v === null ? null :
      Math.round((v - min) / (max - min) * 10000) / 100);
  },

  /**
   * 원본 값 그대로 반환
   */
  raw(values) {
    return values;
  },

  /**
   * 정규화 모드에 따라 변환
   * @param {number[]} values
   * @param {'raw'|'zscore'|'pct'|'minmax'} mode
   */
  normalize(values, mode) {
    switch (mode) {
      case 'zscore': return this.zScore(values);
      case 'pct':    return this.pctChange(values);
      case 'minmax': return this.minMax(values);
      default:       return this.raw(values);
    }
  },

  /**
   * 날짜 배열을 기준으로 두 시리즈를 정렬·병합 (누락 값은 null)
   */
  alignSeries(dates1, values1, dates2, values2) {
    const map1 = new Map(dates1.map((d, i) => [d, values1[i]]));
    const map2 = new Map(dates2.map((d, i) => [d, values2[i]]));
    const allDates = [...new Set([...dates1, ...dates2])].sort();
    return {
      dates:   allDates,
      values1: allDates.map(d => map1.has(d) ? map1.get(d) : null),
      values2: allDates.map(d => map2.has(d) ? map2.get(d) : null),
    };
  },

  /** Y축 레이블 접미사 반환 */
  unitLabel(mode, originalUnit = '') {
    if (mode === 'zscore') return 'σ';
    if (mode === 'pct')    return '%';
    if (mode === 'minmax') return '';
    return originalUnit;
  },
};
