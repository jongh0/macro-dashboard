// ============================================================
// chart-factory.js - ECharts 차트 생성·업데이트 래퍼
// Raw 모드(다중 시리즈) → 좌/우 이중 Y축 (macromicro.me 스타일)
// Z-Score / %변화 모드 → 단일 Y축 정규화
// ============================================================

const ChartFactory = {
  instances: {},

  // ── 테마 색상 (CSS 변수 실시간 읽기) ────────────────────
  _c() {
    const s = getComputedStyle(document.documentElement);
    const g = v => s.getPropertyValue(v).trim();
    return {
      text:      g('--text'),
      textMuted: g('--text-muted'),
      textFaint: g('--text-faint'),
      surface:   g('--surface'),
      surface2:  g('--surface-2'),
      border:    g('--border'),
      border2:   g('--border-2'),
    };
  },

  getOrCreate(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return null;
    if (this.instances[containerId]) return this.instances[containerId];
    const chart = echarts.init(el, null, { renderer: 'canvas' });
    this.instances[containerId] = chart;
    new ResizeObserver(() => chart.resize()).observe(el);
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
    const c = this._c();
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
        lineStyle: { color: c.border2, type: 'dashed', width: 1 },
        data: [{ yAxis: 0 }], label: { show: false },
      };
    }
    if (config.refLines && echartsSeriesList[0]) {
      echartsSeriesList[0].markLine = {
        silent: true, symbol: 'none',
        data: config.refLines.map(r => ({
          yAxis: r.value,
          lineStyle: { color: r.color, type: 'dashed', width: 1 },
          label: { show: true, position: 'insideEndTop', formatter: r.label, color: r.color, fontSize: 11 },
        })),
      };
    }

    // 1-year average line (avg1Y: true 차트, raw 모드에서만)
    let avg1YLabel = null;
    if (config.avg1Y && normalizeMode === 'raw' && processed.length > 0) {
      const s = processed[0];
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const cutoff = oneYearAgo.toISOString().slice(0, 10);

      const vals = [];
      (s.dates || []).forEach((d, i) => {
        if (d >= cutoff && s.values[i] != null && isFinite(s.values[i])) {
          vals.push(s.values[i]);
        }
      });

      if (vals.length > 0) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const dec = avg >= 100 ? 0 : avg >= 10 ? 2 : 4;
        const formatted = avg.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        avg1YLabel = `1Y 평균  ${formatted}`;

        const avgLineData = {
          yAxis: avg,
          lineStyle: { color: '#94a3b8', type: 'dashed', width: 1.2 },
          label: { show: false },
        };
        if (echartsSeriesList[0].markLine) {
          echartsSeriesList[0].markLine.data.push(avgLineData);
        } else {
          echartsSeriesList[0].markLine = {
            silent: true,
            symbol: 'none',
            data: [avgLineData],
          };
        }
      }
    }

    // 3-year average line (avg3Y: true 차트, raw 모드에서만)
    let avg3YLabel = null;
    if (config.avg3Y && normalizeMode === 'raw' && processed.length > 0) {
      const s = processed[0];
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      const cutoff = threeYearsAgo.toISOString().slice(0, 10);

      const vals = [];
      (s.dates || []).forEach((d, i) => {
        if (d >= cutoff && s.values[i] != null && isFinite(s.values[i])) {
          vals.push(s.values[i]);
        }
      });

      if (vals.length > 0) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const dec = avg >= 100 ? 0 : avg >= 10 ? 2 : 4;
        const formatted = avg.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        avg3YLabel = `3Y 평균  ${formatted}`;

        const avgLineData = {
          yAxis: avg,
          lineStyle: { color: '#64748b', type: 'dashed', width: 1.2 },
          label: { show: false },
        };
        if (echartsSeriesList[0].markLine) {
          echartsSeriesList[0].markLine.data.push(avgLineData);
        } else {
          echartsSeriesList[0].markLine = {
            silent: true,
            symbol: 'none',
            data: [avgLineData],
          };
        }
      }
    }

    // ── Y축 설정 ──────────────────────────────────────
    const yAxis = useDualAxis
      ? this._buildDualYAxis(processed, config, c)
      : this._buildSingleYAxis(config, unitLabel, c);

    // ── 범례 ──────────────────────────────────────────
    const legend = hasMultiple ? {
      top: 6, right: 12,
      textStyle: { color: c.textMuted, fontSize: 11 },
      itemWidth: 14, itemHeight: 4, icon: 'rect',
    } : { show: false };

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 400,

      graphic: (() => {
        const items = [];
        if (avg1YLabel) items.push({
          type: 'text', right: 16, top: 8,
          style: { text: avg1YLabel, fill: '#94a3b8', fontSize: 11, fontFamily: 'inherit' },
          silent: true,
        });
        if (avg3YLabel) items.push({
          type: 'text', right: 16, top: avg1YLabel ? 22 : 8,
          style: { text: avg3YLabel, fill: '#64748b', fontSize: 11, fontFamily: 'inherit' },
          silent: true,
        });
        return items;
      })(),

      grid: {
        top: 32,
        right: 8,
        bottom: 44,
        left: 8,
        containLabel: true,
      },

      xAxis: {
        type: 'time',
        min: startDate,
        axisLine: { lineStyle: { color: c.border2 } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: c.textMuted, fontSize: 11,
          formatter: val => {
            const d = new Date(val);
            return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
          },
          hideOverlap: true,
        },
      },

      yAxis,
      legend,
      tooltip: this._buildTooltipConfig(config, processed, useDualAxis, c),
      dataZoom: [{ type: 'inside', startValue: startDate }],
      series: echartsSeriesList,
    };
  },

  // ── 이중 Y축 (Raw 모드) ──────────────────────────────
  _buildDualYAxis(seriesData, config, c) {
    const leftColor  = seriesData[0]?.color || c.textMuted;
    const rightColor = seriesData[1]?.color || c.textMuted;

    const makeAxis = (color, position, showSplit, min, max) => ({
      type: 'value',
      scale: true,
      min,
      max,
      position,
      axisLine: { show: true, lineStyle: { color, width: 1 } },
      axisTick: { show: false },
      splitLine: showSplit
        ? { lineStyle: { color: c.surface2, type: 'solid' } }
        : { show: false },
      axisLabel: {
        color,
        fontSize: 10,
        formatter: val => this._formatAxisLabel(val, config.format, config.koUnit),
      },
    });

    return [
      makeAxis(leftColor,  'left',  true,  config.yMinLeft,  config.yMaxLeft),
      makeAxis(rightColor, 'right', false, config.yMinRight, config.yMaxRight),
    ];
  },

  // ── 단일 Y축 (Z-Score / %변화) ──────────────────────
  _buildSingleYAxis(config, unitLabel, c) {
    return {
      type: 'value',
      scale: true,
      min: config.yMin !== undefined ? config.yMin : undefined,
      max: config.yMax !== undefined ? config.yMax : undefined,
      name: unitLabel || '',
      nameLocation: 'end',
      nameTextStyle: { color: c.textFaint, fontSize: 10, padding: [0, 0, 2, -4] },
      nameGap: 6,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: c.surface2, type: 'solid' } },
      axisLabel: {
        color: c.textMuted, fontSize: 11,
        formatter: val => this._formatAxisLabel(val, config.format, config.koUnit),
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

  _buildTooltipConfig(config, seriesData, useDualAxis, c) {
    return {
      trigger: 'axis',
      confine: true,
      axisPointer: {
        type: 'cross',
        crossStyle: { color: c.textFaint },
        lineStyle: { color: c.textFaint, type: 'dashed' },
      },
      backgroundColor: c.surface2,
      borderColor: c.border2,
      borderWidth: 1,
      textStyle: { color: c.text, fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.2);',
      formatter: params => {
        if (!params || !params.length) return '';
        const d = new Date(params[0].axisValue);
        const dateStr = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
        let html = `<div style="margin-bottom:4px;color:${c.textFaint};font-size:11px">${dateStr}</div>`;
        params.forEach(p => {
          const val = Array.isArray(p.value) ? p.value[1] : p.value;
          const unit = useDualAxis ? (config.unit || '') : '';
          const formatted = this._formatValue(val, config.format, unit);
          html += `<div style="display:flex;align-items:center;gap:8px;margin:2px 0">
            <span style="display:inline-block;width:10px;height:3px;border-radius:2px;background:${p.color}"></span>
            <span style="color:${c.textMuted};font-size:11px">${p.seriesName}</span>
            <span style="margin-left:auto;font-weight:600;font-size:12px;color:${c.text}">${formatted}</span>
          </div>`;
        });
        return html;
      },
    };
  },

  _formatAxisLabel(val, format, koUnit = false) {
    if (val === null || val === undefined || isNaN(val)) return '';
    if (koUnit) {
      const abs  = Math.abs(val);
      const sign = val < 0 ? '-' : '';
      if (abs >= 1e8) return sign + (abs / 1e8).toFixed(0) + '억';
      if (abs >= 1e4) return sign + (abs / 1e4).toFixed(0) + '만';
      if (abs >= 1e3) return sign + (abs / 1e3).toFixed(0) + '천';
      return val.toLocaleString();
    }
    if (Math.abs(val) >= 1e12) return (val / 1e12).toFixed(1) + 'T';
    if (Math.abs(val) >= 1e9)  return (val / 1e9).toFixed(1) + 'B';
    if (Math.abs(val) >= 1e6)  return (val / 1e6).toFixed(1) + 'M';
    const frac = format === 'integer' ? 0 : 1;
    return format === 'percent' ? val.toFixed(1) : val.toLocaleString(undefined, { maximumFractionDigits: frac });
  },

  _formatValue(val, format, unit) {
    if (val === null || val === undefined || isNaN(val)) return 'N/A';
    const frac = format === 'integer' ? 0 : 2;
    let str;
    if (Math.abs(val) >= 1e12)      str = (val / 1e12).toFixed(frac) + 'T';
    else if (Math.abs(val) >= 1e9)  str = (val / 1e9).toFixed(frac)  + 'B';
    else if (Math.abs(val) >= 1e6)  str = (val / 1e6).toFixed(frac)  + 'M';
    else str = format === 'percent'
      ? val.toFixed(2)
      : val.toLocaleString(undefined, { maximumFractionDigits: frac });
    return unit ? str + ' ' + unit : str;
  },

  dispose(containerId) {
    if (this.instances[containerId]) {
      this.instances[containerId].dispose();
      delete this.instances[containerId];
    }
  },
};
