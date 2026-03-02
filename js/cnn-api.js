// ============================================================
// cnn-api.js - Fear & Greed 정적 파일 로더 (GitHub Pages용)
// 데이터는 GitHub Actions에서 data/ 폴더에 미리 저장됩니다.
// ============================================================

const CnnAPI = {
  /**
   * Fear & Greed 지수 조회 (정적 파일에서)
   * @returns {Promise<{dates: string[], values: number[], current: object}>}
   */
  async fetchFearGreed(startDate = '2020-01-01') {
    const cacheKey = 'fg_all';
    const cached = Cache.get(cacheKey);
    if (cached) return { ...cached, fromCache: true };

    // CNN 주식 시장 Fear & Greed (cnn_fg.json) 우선
    for (const filename of ['cnn_fg.json', 'fg.json']) {
      try {
        const resp = await fetch(`./data/${filename}`);
        if (!resp.ok) continue;
        const json = await resp.json();
        const result = {
          dates:     json.dates,
          values:    json.values,
          current:   json.current || {},
          fetchedAt: new Date(json.updated).getTime(),
          fromStatic: true,
        };
        Cache.set(cacheKey, result, 24 * 60 * 60 * 1000);
        return result;
      } catch (e) {
        console.warn(`FG 파일 로드 실패 [${filename}]:`, e.message);
      }
    }

    throw new Error('FG_STATIC_FILE_NOT_FOUND');
  },
};

// ============================================================
// StaticAPI - 정적 파일 로더 (FINRA 마진 부채 등)
// ============================================================
const StaticAPI = {
  _cache: {},

  async fetch(filename) {
    if (this._cache[filename]) return this._cache[filename];

    const resp = await fetch(`./data/${filename}`);
    if (!resp.ok) throw new Error(`Static file not found: ${filename}`);
    const json = await resp.json();

    const result = {
      dates:    json.dates,
      values:   json.values,
      fetchedAt: new Date(json.updated || Date.now()).getTime(),
    };

    this._cache[filename] = result;
    return result;
  },
};
