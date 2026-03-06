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
          ${config.series && config.series.length > 1 ? `<span class="card-secondary" id="secondary-${config.id}" style="display:none"></span>` : ''}
          <span class="card-market-status" id="market-status-${config.id}" style="display:none"></span>
          <span class="card-mdd" id="mdd-${config.id}" style="display:none"></span>
        </div>
      </div>

      <div class="chart-area" id="chart-${config.id}"></div>

      ${config.reading ? `
      <div class="reading-panel" id="reading-${config.id}">
        <ul>${config.reading.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>` : ''}

      ${hasModes ? `
      <div class="card-footer">
        <div class="normalize-group" id="norm-${config.id}">
          <button class="norm-btn ${config.defaultNormalize === 'raw' || !config.defaultNormalize ? 'active' : ''}" data-mode="raw" onclick="app.setNormalize('${config.id}','raw',this)">Raw</button>
          <button class="norm-btn ${config.defaultNormalize === 'zscore' ? 'active' : ''}" data-mode="zscore" onclick="app.setNormalize('${config.id}','zscore',this)">Z-Score</button>
          <button class="norm-btn ${config.defaultNormalize === 'pct' ? 'active' : ''}" data-mode="pct" onclick="app.setNormalize('${config.id}','pct',this)">%변화</button>
        </div>
      </div>` : ''}
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
    const hours = String(d.getHours()).padStart(2, '0');
    const mins  = String(d.getMinutes()).padStart(2, '0');
    el.textContent = `${hours}:${mins}`;
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
    const range = this._effectiveRange(
      entry.config.defaultRange || this.currentRange,
      entry.seriesData
    );
    ChartFactory.render(
      `chart-${chartId}`,
      entry.config,
      entry.seriesData,
      entry.normalizeMode,
      range
    );
  }

  /** 선택 범위 내 데이터 포인트가 부족하면 자동으로 더 넓은 범위로 확장 */
  _effectiveRange(range, seriesData) {
    const RANGES = ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'];
    const primary = seriesData[0];
    if (!primary || !primary.dates || !primary.dates.length) return range;
    let idx = RANGES.indexOf(range);
    if (idx < 0) return range;
    while (idx < RANGES.length - 1) {
      const startDate = getRangeStartDate(RANGES[idx]);
      const count = primary.dates.filter(d => d >= startDate).length;
      if (count >= 3) break;
      idx++;
    }
    return RANGES[idx];
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

    const primarySeriesCfg = config.series?.[0];
    const noDecimal = primarySeriesCfg?.noDecimal || false;

    if (currentEl && lastVal !== null) {
      currentEl.textContent = this._formatDisplay(lastVal, config, noDecimal);
    }

    if (changeEl && lastVal !== null && prevVal !== null) {
      const diff = lastVal - prevVal;
      const pct  = prevVal !== 0 ? (diff / Math.abs(prevVal)) * 100 : 0;
      const sign = diff >= 0 ? '+' : '';
      changeEl.textContent = `${sign}${pct.toFixed(2)}%`;
      changeEl.className = 'card-change ' + (diff >= 0 ? 'positive' : 'negative');
    }

    // 두 번째 시리즈 값 표시 (비교 차트, series.unit이 정의된 경우만)
    const secondaryEl = document.getElementById(`secondary-${chartId}`);
    if (secondaryEl && seriesDataList.length > 1 && config.series?.[1]?.unit !== undefined) {
      const s2Data = seriesDataList[1];
      const s2Cfg  = config.series[1];
      const val2   = this._lastValid(s2Data.values);
      if (val2 !== null) {
        secondaryEl.style.display = '';
        secondaryEl.style.color = s2Data.color;
        secondaryEl.textContent = `· ${s2Data.label} ${this._formatSeriesValue(val2, s2Cfg)}`;
      }
    }

    const el = document.getElementById(`status-${chartId}`);
    if (el) { el.style.display = 'none'; }

    this._computeStatus(chartId);
  }

  // ──────────────────────────────────────────
  // 시장 상태 라벨 계산 및 표시
  // ──────────────────────────────────────────
  _computeStatus(chartId) {
    const entry = this.charts[chartId];
    if (!entry || !entry.config.statusConfig || !entry.seriesData) return;

    const primary = entry.seriesData[0];
    if (!primary || primary.values.length === 0) return;

    const statusEl = document.getElementById(`market-status-${chartId}`);
    if (!statusEl) return;

    const lastVal = this._lastValid(primary.values);
    if (lastVal === null) return;

    const sc = entry.config.statusConfig;
    let label = null, color = null;

    if (sc.type === 'threshold') {
      for (const t of sc.thresholds) {
        if (t.max === undefined || lastVal <= t.max) {
          label = t.label; color = t.color; break;
        }
      }
    } else if (sc.type === 'drawdown') {
      const lookback = sc.window || 252;
      const start  = Math.max(0, primary.values.length - lookback);
      const slice  = primary.values.slice(start).filter(v => v !== null && !isNaN(v));
      if (!slice.length) return;
      const high     = Math.max(...slice);
      const drawdown = high > 0 ? (lastVal - high) / high : 0;
      for (const t of sc.thresholds) {
        if (t.max === undefined || drawdown <= t.max) {
          label = t.label; color = t.color; break;
        }
      }
      // MDD 별도 라벨
      const mddEl = document.getElementById(`mdd-${chartId}`);
      if (mddEl && drawdown < -0.001) {
        const pct = (drawdown * 100).toFixed(1);
        mddEl.style.display = '';
        mddEl.textContent   = `MDD ${pct}%`;
        mddEl.dataset.negative = drawdown < -0.10 ? 'severe'
                               : drawdown < -0.05 ? 'moderate'
                               : 'mild';
      }
    }

    if (label && color) {
      statusEl.style.display = '';
      statusEl.textContent   = label;
      statusEl.style.background = color + '22';
      statusEl.style.color      = color;
      statusEl.style.border     = `1px solid ${color}55`;
    }
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

  _formatDisplay(val, config, noDecimal = false) {
    if (val === null || isNaN(val)) return '—';
    const unit = config.unit || '';
    // 한국어 단위 (건, 명 등 카운트 단위)
    if (config.koUnit) {
      const abs  = Math.abs(val);
      const sign = val < 0 ? '-' : '';
      if (abs >= 1e8) return sign + (abs / 1e8).toFixed(1) + '억 ' + unit;
      if (abs >= 1e4) return sign + (abs / 1e4).toFixed(1) + '만 ' + unit;
      if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + '천 ' + unit;
      return val.toLocaleString() + (unit ? ' ' + unit : '');
    }
    if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(2) + 'M ' + unit;
    const decimals = noDecimal ? 0 : 2;
    return val.toLocaleString(undefined, { maximumFractionDigits: decimals }) + (unit ? ' ' + unit : '');
  }

  _formatSeriesValue(val, seriesCfg) {
    if (val === null || isNaN(val)) return '—';
    const dec  = seriesCfg.decimals !== undefined ? seriesCfg.decimals : 2;
    const unit = seriesCfg.unit || '';
    let str;
    const abs = Math.abs(val);
    if (abs >= 1e12)     str = (val / 1e12).toFixed(1) + 'T';
    else if (abs >= 1e9) str = (val / 1e9).toFixed(1)  + 'B';
    else if (abs >= 1e6) str = (val / 1e6).toFixed(1)  + 'M';
    else str = val.toLocaleString(undefined, { maximumFractionDigits: dec, minimumFractionDigits: dec });
    return str + (unit ? ' ' + unit : '');
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


}

// ──────────────────────────────────
// 앱 시작
// ──────────────────────────────────
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new MacroDashboard();
});
