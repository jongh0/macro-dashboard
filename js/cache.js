// ============================================================
// cache.js - 인메모리 캐시 (GitHub Pages 정적 파일용)
// ============================================================

const Cache = {
  _store: {},

  get(key) {
    const entry = this._store[key];
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      delete this._store[key];
      return null;
    }
    return entry.data;
  },

  set(key, data, ttl = 3600000) {
    this._store[key] = { data, expires: Date.now() + ttl };
  },

  invalidate(key) {
    delete this._store[key];
  },

  clear() {
    this._store = {};
  },
};
