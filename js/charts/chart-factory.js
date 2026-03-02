// ============================================================
// chart-factory.js - ECharts 차트 생성·업데이트 래퍼
// Raw 모드(다중 시리즈) → 좌/우 이중 Y축 (macromicro.me 스타일)
// Z-Score / %변화 모드 → 단일 Y축 정규화
// ============================================================

const ChartFactory = {
  instances: {},

  getOrCreate(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return null;
    if (this.instances[containerId]) return this.instances[containerId];
    const chart = echarts.init(el, null, { renderer: 'canvas' });
    this.instances[containerId] = chart;
    window.addEventListener('resize', () => chart.resize());
    return chart;
  },

  render(containerId, config, seriesData, normalizeMode = 'raw', range = '1Y') {
    const chart = this.getOrCreate(containerId);
    if (!chart) return;
    const startDate = getRangeStartDate(range);
    const option = this._buildOption(config, seriesData, normalizeMode, startDate);
    chart.setOption(option, { notMerge: true });
  },

  _buildOption(config, seriesData, normalizeMode, startDate) {
    const hasMultiple = seriesData.length > 1;

    // ── 이중 Y축 여부 결정 ──────────────────────────
    // Raw 모드 + 다중 시리즈 → 좌(S&P500) / 우(보조지표) 이중축
    const useDualAxis = normalizeMode === 'raw' && hasMultiple;

    // ── 데이터 정규화 (이중축이면 raw 그대로) ─────────
    const processed = seriesData.map(s => ({
      ...s,
      values: useDualAxis
        ? s.values
        : Normalizer.normalize(s.values, hasMultiple ? normalizeMode : (normalizeMode !== 'raw' ? normalizeMode : 'raw')),
    }));

    const unitLabel = useDualAxis ? '' : Normalizer.unitLabel(normalizeMode, config.unit || '');

    // ── ECharts 시리즈 생성 ───────────────────────────
    const echartsSeriesList = processed.map((s, i) =>
      this._buildSeries(s, config, useDualAxis && i > 0 ? 1 : 0)
    );

    // 기준선 (0선, refLines)
    if (config.zeroLine && echartsSeriesList[0]) {
      echartsSeriesList[0].markLine = {
        silent: true, symbol: 'none',
        lineStyle: { color: '#6b7280', type: 'dashed', width: 1 },
        data: [{ yAxis: 0 }], label: { show: false },
      };
    }
    if (config.refLines && echartsSeriesList[0]) {
      echartsSeriesList[0].markLine = {
        silent: true, symbol: 'none',
        data: config.refLines.map(r => ({
          yAxis: r.value,
          lineStyle: { color: r.color, type: 'dashed', width: 1 },
          label: { show: true, position: 'end', formatter: r.label, color: r.color, fontSize: 11 },
        })),
      };
    }

    // ── Y축 설정 ──────────────────────────────────────
    const yAxis = useDualAxis
      ? this._buildDualYAxis(processed, config)
      : this._buildSingleYAxis(config, unitLabel);

    // ── 범례 ──────────────────────────────────────────
    const legend = hasMultiple ? {
      top: 6, right: 12,
      textStyle: { color: '#94a3b8', fontSize: 11 },
      itemWidth: 14, itemHeight: 4, icon: 'rect',
    } : { show: false };

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 400,

      grid: {
        top: 32,
        right: useDualAxis ? 72 : 16,   // 오른쪽 Y축 공간
        bottom: 44,
        left: 62,
        containLabel: false,
      },

      xAxis: {
        type: 'time',
        min: startDate,
        axisLine: { lineStyle: { color: '#334155' } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: '#94a3b8', fontSize: 11,
          formatter: val => {
            const d = new Date(val);
            return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
          },
          hideOverlap: true,
        },
      },

      yAxis,
      legend,
      tooltip: this._buildTooltipConfig(config, processed, useDualAxis),
      dataZoom: [{ type: 'inside', startValue: startDate }],
      series: echartsSeriesList,
    };
  },

  // ── 이중 Y축 (Raw 모드) ──────────────────────────────
  _buildDualYAxis(seriesData, config) {
    const leftColor  = seriesData[0]?.color || '#94a3b8';
    const rightColor = seriesData[1]?.color || '#94a3b8';

    const makeAxis = (color, position, showSplit, min, max) => ({
      type: 'value',
      scale: true,
      min,
      max,
      position,
      axisLine: { show: true, lineStyle: { color, width: 1 } },
      axisTick: { show: false },
      splitLine: showSplit
        ? { lineStyle: { color: '#1e293b', type: 'solid' } }
        : { show: false },
      axisLabel: {
        color,
        fontSize: 10,
        formatter: val => this._formatAxisLabel(val, config.format),
      },
    });

    return [
      makeAxis(leftColor,  'left',  true,  config.yMinLeft,  config.yMaxLeft),
      makeAxis(rightColor, 'right', false, config.yMinRight, config.yMaxRight),
    ];
  },

  // ── 단일 Y축 (Z-Score / %변화) ──────────────────────
  _buildSingleYAxis(config, unitLabel) {
    return {
      type: 'value',
      scale: true,
      min: config.yMin !== undefined ? config.yMin : undefined,
      max: config.yMax !== undefined ? config.yMax : undefined,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#1e293b', type: 'solid' } },
      axisLabel: {
        color: '#94a3b8', fontSize: 11,
        formatter: val => this._formatAxisLabel(val, config.format) + (unitLabel ? ' ' + unitLabel : ''),
      },
    };
  },

  _buildSeries(s, config, yAxisIndex = 0) {
    const data = (s.dates || []).map((d, i) => [d, s.values[i]]);
    const base = {
      name: s.label,
      type: 'line',
      data,
      yAxisIndex,
      showSymbol: false,
      lineStyle: { color: s.color, width: 1.8 },
      itemStyle: { color: s.color },
      smooth: 0.25,
      connectNulls: true,
      emphasis: { focus: 'series' },
    };
    if (s.areaStyle) {
      base.areaStyle = {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: s.color + '44' },
            { offset: 1, color: s.color + '05' },
          ],
        },
      };
    }
    return base;
  },

  _buildTooltipConfig(config, seriesData, useDualAxis) {
    return {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: { color: '#475569' },
        lineStyle: { color: '#475569', type: 'dashed' },
      },
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      borderWidth: 1,
      textStyle: { color: '#f1f5f9', fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.4);',
      formatter: params => {
        if (!params || !params.length) return '';
        const d = new Date(params[0].axisValue);
        const dateStr = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
        let html = `<div style="margin-bottom:4px;color:#64748b;font-size:11px">${dateStr}</div>`;
        params.forEach(p => {
          const val = Array.isArray(p.value) ? p.value[1] : p.value;
          const unit = useDualAxis ? (config.unit || '') : '';
          const formatted = this._formatValue(val, config.format, unit);
          html += `<div style="display:flex;align-items:center;gap:8px;margin:2px 0">
            <span style="display:inline-block;width:10px;height:3px;border-radius:2px;background:${p.color}"></span>
            <span style="color:#94a3b8;font-size:11px">${p.seriesName}</span>
            <span style="margin-left:auto;font-weight:600;font-size:12px">${formatted}</span>
          </div>`;
        });
        return html;
      },
    };
  },

  _formatAxisLabel(val, format) {
    if (val === null || val === undefined || isNaN(val)) return '';
    if (Math.abs(val) >= 1e12) return (val / 1e12).toFixed(1) + 'T';
    if (Math.abs(val) >= 1e9)  return (val / 1e9).toFixed(1) + 'B';
    if (Math.abs(val) >= 1e6)  return (val / 1e6).toFixed(1) + 'M';
    return format === 'percent' ? val.toFixed(1) : val.toLocaleString(undefined, { maximumFractionDigits: 1 });
  },

  _formatValue(val, format, unit) {
    if (val === null || val === undefined || isNaN(val)) return 'N/A';
    let str;
    if (Math.abs(val) >= 1e12)      str = (val / 1e12).toFixed(2) + 'T';
    else if (Math.abs(val) >= 1e9)  str = (val / 1e9).toFixed(2)  + 'B';
    else if (Math.abs(val) >= 1e6)  str = (val / 1e6).toFixed(2)  + 'M';
    else str = format === 'percent'
      ? val.toFixed(2)
      : val.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return unit ? str + ' ' + unit : str;
  },

  dispose(containerId) {
    if (this.instances[containerId]) {
      this.instances[containerId].dispose();
      delete this.instances[containerId];
    }
  },
};
