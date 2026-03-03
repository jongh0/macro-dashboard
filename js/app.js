// ============================================================
// app.js - 매크로 대시보드 메인 애플리케이션
// ============================================================

class MacroDashboard {
  constructor() {
    this.currentRange = CONFIG.DEFAULT_RANGE;
    this.charts = {};   // id → { config, normalizeMode, seriesData }
    this._init();
  }

  // ──────────────────────────────────
  // 초기화
  // ──────────────────────────────────
  _init() {
    this._bindGlobalEvents();
    this._renderChartCards();
    this._loadAllCharts();
  }

  // ──────────────────────────────────
  // 차트 카드 DOM 생성
  // ──────────────────────────────────
  _renderChartCards() {
    const grid = document.getElementById('chart-grid');
    CHART_CONFIGS.forEach(config => {
      const card = this._createCard(config);
      grid.appendChild(card);
      this.charts[config.id] = {
        config,
        normalizeMode: config.defaultNormalize || 'raw',
        seriesData: null,
      };
    });
  }

  _createCard(config) {
    const cat = CATEGORIES[config.category] || { label: config.category, color: '#64748b' };
    const hasModes = (config.normalizeModes || []).length > 1 ||
      (config.series && config.series.length > 1);

    const card = document.createElement('div');
    card.className = 'chart-card';
    card.id = `card-${config.id}`;
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title-row">
          <span class="category-badge" style="background:${cat.color}22;color:${cat.color}">${cat.label}</span>
          <h3 class="card-title">${config.title}</h3>
          <div class="card-badges">
            <span class="status-badge loading" id="status-${config.id}">로딩 중…</span>
          </div>
        </div>
        <p class="card-desc">${config.description}</p>
        <div class="card-value-row">
          <span class="card-current" id="current-${config.id}">—</span>
          <span class="card-change" id="change-${config.id}"></span>
        </div>
      </div>

      <div class="chart-area" id="chart-${config.id}"></div>

      ${config.reading ? `
      <div class="reading-panel" id="reading-${config.id}">
        <ul>${config.reading.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>` : ''}

      <div class="card-footer">
        ${hasModes ? `
        <div class="normalize-group" id="norm-${config.id}">
          <button class="norm-btn ${config.defaultNormalize === 'raw' || !config.defaultNormalize ? 'active' : ''}" data-mode="raw" onclick="app.setNormalize('${config.id}','raw',this)">Raw</button>
          <button class="norm-btn ${config.defaultNormalize === 'zscore' ? 'active' : ''}" data-mode="zscore" onclick="app.setNormalize('${config.id}','zscore',this)">Z-Score</button>
          <button class="norm-btn ${config.defaultNormalize === 'pct' ? 'active' : ''}" data-mode="pct" onclick="app.setNormalize('${config.id}','pct',this)">%변화</button>
        </div>` : '<div></div>'}
        <div class="footer-right">
          <button class="icon-btn" title="새로고침" onclick="app.refreshChart('${config.id}')">↻</button>
        </div>
      </div>
    `;
    return card;
  }

  // ──────────────────────────────────
  // 데이터 로드
  // ──────────────────────────────────
  async _loadAllCharts() {
    const promises = CHART_CONFIGS.map(config =>
      this._loadChart(config.id).catch(e => console.error(`차트 로드 실패 [${config.id}]:`, e))
    );
    await Promise.allSettled(promises);
    this._updateDataDate();
  }

  _updateDataDate() {
    let maxFetchedAt = 0;
    for (const entry of Object.values(this.charts)) {
      if (!entry.seriesData) continue;
      for (const s of entry.seriesData) {
        if (s.fetchedAt && s.fetchedAt > maxFetchedAt) maxFetchedAt = s.fetchedAt;
      }
    }
    const el = document.getElementById('data-date');
    if (!el || !maxFetchedAt) return;
    const d = new Date(maxFetchedAt);
    el.textContent = `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
  }

  async _loadChart(chartId) {
    const entry = this.charts[chartId];
    if (!entry) return;
    const { config } = entry;

    this._setStatus(chartId, 'loading', '로딩 중…');

    const seriesDataList = [];

    for (const s of config.series) {
      try {
        const data = await this._fetchSeries(s);
        seriesDataList.push({
          id:       s.id,
          label:    s.label,
          color:    s.color,
          areaStyle: s.areaStyle || false,
          dates:    data.dates,
          values:   data.values,
          fromStatic: data.fromStatic || false,
          fetchedAt: data.fetchedAt,
        });
      } catch (e) {
        console.error(`시리즈 로드 실패 [${s.id}]:`, e.message);
        seriesDataList.push({
          id: s.id, label: s.label, color: s.color,
          dates: [], values: [], error: e.message,
        });
      }
    }

    // 단위 배율 적용
    const multiplier = config.valueMultiplier || 1;
    if (multiplier !== 1) {
      seriesDataList.forEach(s => {
        s.values = s.values.map(v => (v !== null && !isNaN(v)) ? v * multiplier : v);
      });
    }

    entry.seriesData = seriesDataList;
    this._renderChart(chartId);
    this._updateCardMeta(chartId, seriesDataList);
  }

  async _fetchSeries(seriesDef) {
    switch (seriesDef.type) {
      case 'fred':
        return FredAPI.fetchSeries(seriesDef.seriesId, CONFIG.DATA_START, seriesDef.units || 'lin');
      case 'cnn':
        return CnnAPI.fetchFearGreed();
      case 'static':
        return StaticAPI.fetch(seriesDef.file);
      default:
        throw new Error(`Unknown series type: ${seriesDef.type}`);
    }
  }

  // ──────────────────────────────────
  // 차트 렌더링
  // ──────────────────────────────────
  _renderChart(chartId) {
    const entry = this.charts[chartId];
    if (!entry || !entry.seriesData) return;
    const range = entry.config.defaultRange || this.currentRange;
    ChartFactory.render(
      `chart-${chartId}`,
      entry.config,
      entry.seriesData,
      entry.normalizeMode,
      range
    );
  }

  // ──────────────────────────────────
  // 카드 메타 업데이트 (현재값, 변화율, 상태)
  // ──────────────────────────────────
  _updateCardMeta(chartId, seriesDataList) {
    const primary = seriesDataList[0];
    if (!primary || primary.values.length === 0) {
      this._setStatus(chartId, 'error', '데이터 없음');
      return;
    }

    const lastVal = this._lastValid(primary.values);
    const prevVal = this._lastValid(primary.values, 2);
    const config  = this.charts[chartId].config;

    const currentEl = document.getElementById(`current-${chartId}`);
    const changeEl  = document.getElementById(`change-${chartId}`);

    if (currentEl && lastVal !== null) {
      currentEl.textContent = this._formatDisplay(lastVal, config);
    }

    if (changeEl && lastVal !== null && prevVal !== null) {
      const diff = lastVal - prevVal;
      const pct  = prevVal !== 0 ? (diff / Math.abs(prevVal)) * 100 : 0;
      const sign = diff >= 0 ? '+' : '';
      changeEl.textContent = `${sign}${pct.toFixed(2)}%`;
      changeEl.className = 'card-change ' + (diff >= 0 ? 'positive' : 'negative');
    }

    const el = document.getElementById(`status-${chartId}`);
    if (el) { el.style.display = 'none'; }
  }

  _lastValid(values, nth = 1) {
    let count = 0;
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] !== null && !isNaN(values[i])) {
        count++;
        if (count === nth) return values[i];
      }
    }
    return null;
  }

  _formatDisplay(val, config) {
    if (val === null || isNaN(val)) return '—';
    if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(2) + 'M ' + (config.unit || '');
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 }) + (config.unit ? ' ' + config.unit : '');
  }

  _setStatus(chartId, type, text) {
    const el = document.getElementById(`status-${chartId}`);
    if (!el) return;
    el.style.display = '';
    el.className = `status-badge ${type}`;
    el.textContent = text;
  }

  // ──────────────────────────────────
  // 이벤트 처리
  // ──────────────────────────────────
  _bindGlobalEvents() {
    document.querySelectorAll('.range-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentRange = btn.dataset.range;
        this._reRenderAll();
      });
    });
  }

  /** 전체 차트 재렌더링 (기간 변경 등) */
  _reRenderAll() {
    Object.keys(this.charts).forEach(id => this._renderChart(id));
  }

  /** 정규화 모드 변경 */
  setNormalize(chartId, mode, btnEl) {
    const entry = this.charts[chartId];
    if (!entry) return;
    entry.normalizeMode = mode;
    const group = document.getElementById(`norm-${chartId}`);
    group?.querySelectorAll('.norm-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    this._renderChart(chartId);
  }

  /** 단일 차트 재렌더링 */
  refreshChart(chartId) {
    this._renderChart(chartId);
  }
}

// ──────────────────────────────────
// 앱 시작
// ──────────────────────────────────
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new MacroDashboard();
});
