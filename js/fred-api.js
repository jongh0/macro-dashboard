// ============================================================
// fred-api.js - 정적 JSON 파일 로더 (GitHub Pages용)
// 데이터는 GitHub Actions에서 data/ 폴더에 미리 저장됩니다.
// ============================================================

const FredAPI = {
  /**
   * FRED 시계열 데이터 조회 (정적 파일에서)
   * @param {string} seriesId  - FRED 시리즈 ID (예: 'CPIAUCSL')
   * @param {string} startDate - 사용하지 않음 (정적 파일에 전체 데이터 포함)
   * @param {string} units     - 단위 ('lin'|'chg'|'ch1'|'pch'|'pc1'|'log')
   * @returns {Promise<{dates: string[], values: number[]}>}
   */
  async fetchSeries(seriesId, startDate = '2000-01-01', units = 'lin') {
    const cacheKey = `fred_${seriesId}_${units}`;
    const cached = Cache.get(cacheKey);
    if (cached) return { ...cached, fromCache: true };

    const filename = this._staticName(seriesId, units);
    if (!filename) throw new Error(`No static file mapped for ${seriesId}/${units}`);

    const resp = await fetch(`./data/${filename}`, { cache: 'no-cache' });
    if (!resp.ok) throw new Error(`Static file not found: ${filename}`);
    const json = await resp.json();

    const result = {
      dates:     json.dates,
      values:    json.values,
      seriesId,
      units,
      fetchedAt: new Date(json.updated).getTime(),
      fromStatic: true,
    };
    Cache.set(cacheKey, result, 24 * 60 * 60 * 1000);
    return result;
  },

  /** FRED 시리즈 ID → 정적 파일 이름 맵핑 */
  _staticName(seriesId, units) {
    const map = {
      'SP500':    { lin: 'fred_sp500.json' },
      'VIXCLS':   { lin: 'fred_vix.json' },
      'FEDFUNDS': { lin: 'fred_fedfunds.json' },
      'T10Y2Y':   { lin: 'fred_t10y2y.json' },
      'DGS10':    { lin: 'fred_dgs10.json' },
      'DGS2':     { lin: 'fred_dgs2.json' },
      'CPIAUCSL': { pc1: 'fred_cpi.json' },
      'CPILFESL': { pc1: 'fred_core_cpi.json' },
      'M2SL':     { pc1: 'fred_m2.json', lin: 'fred_m2_level.json' },
      'UNRATE':           { lin: 'fred_unrate.json' },
      'PCEPI':            { pc1: 'fred_pce.json' },
      'PCEPILFE':         { pc1: 'fred_core_pce.json' },
      'UMCSENT':          { lin: 'fred_umcsent.json' },
      'DTWEXBGS':         { lin: 'fred_dxy.json' },
      'DCOILWTICO':       { lin: 'fred_wti.json' },
      'PCOPPUSDM':        { lin: 'fred_copper.json' },
      'CSUSHPINSA':       { lin: 'fred_housing.json' },
      'BAMLH0A0HYM2':     { lin: 'fred_hyspread.json' },
      'T10Y3M':           { lin: 'fred_t10y3m.json' },
      'T10YIE':           { lin: 'fred_t10yie.json' },
      'PAYEMS':           { chg: 'fred_payems_chg.json', lin: 'fred_payems.json' },
      'ICSA':             { lin: 'fred_icsa.json' },
      'GDPC1':            { pc1: 'fred_gdp.json' },
      'JTSJOL':           { lin: 'fred_jolts.json' },
      'DGS30':            { lin: 'fred_dgs30.json' },
      'DHHNGSP':          { lin: 'fred_natgas.json' },
      'DEXJPUS':          { lin: 'fred_usdjpy.json' },
      'DEXUSEU':          { lin: 'fred_eurusd.json' },
      'DEXKOUS':          { lin: 'fred_usdkrw.json' },
    };
    return map[seriesId]?.[units] || null;
  },
};
