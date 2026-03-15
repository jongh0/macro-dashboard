# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Run the dashboard locally:**
```bat
start.bat                          # Starts Python HTTP server at http://localhost:8080
python -m http.server 8080         # Equivalent direct command
```

**Update all data:**
```bat
update.bat YOUR_FRED_API_KEY       # Full update (or set FRED_API_KEY env var first)
```

**Selective data update (Python):**
```bash
pip install requests pandas openpyxl yfinance xlrd

python scripts/update_data.py --all             # All sources
python scripts/update_data.py --market          # S&P500/NASDAQ/DJIA/VIX/WTI/구리/천연가스 (yfinance)
python scripts/update_data.py --yahoo           # 금, 은 (yfinance)
python scripts/update_data.py --forex           # USD/KRW, USD/JPY, EUR/USD
python scripts/update_data.py --fg              # Fear & Greed (CNN + Crypto)
python scripts/update_data.py --shiller         # Shiller P/E
python scripts/update_data.py --finra           # FINRA margin debt
python scripts/update_data.py --fred            # All FRED series (API key required)
```

## Architecture

This is a **serverless static dashboard**. The browser loads `index.html` and fetches pre-built JSON files from `data/`. No runtime API calls are made from the browser to external APIs — all data is pre-fetched by `scripts/update_data.py` and stored as static JSON.

### Data Flow
```
External APIs (FRED, yfinance, CNN, FINRA, Shiller)
  → scripts/update_data.py
    → data/*.json  (static files, format: {updated, dates[], values[]})
      → Browser fetches JSON via fetch('./data/filename.json')
```

### JavaScript Module Loading Order (index.html script tags)
1. `js/config.js` — `CONFIG`, `CATEGORIES`, `getRangeStartDate()`
2. `js/cache.js` — `Cache` (in-memory TTL cache)
3. `js/normalizer.js` — `Normalizer` (z-score, pct, minmax transforms)
4. `js/fred-api.js` — `FredAPI` + `StaticAPI` (fetches `data/*.json`)
5. `js/cnn-api.js` — `CnnAPI` (fetches `cnn_fg.json` / `fg.json`)
6. `js/charts/chart-configs.js` — `CHART_CONFIGS` array (all chart definitions)
7. `js/charts/chart-factory.js` — `ChartFactory` (ECharts rendering)
8. `js/app.js` — `MacroDashboard` class (entry point, creates `app` global)

All modules are plain globals — no bundler, no ES modules.

### Adding a New Chart
1. Add an entry to `CHART_CONFIGS` in `js/charts/chart-configs.js`
2. If the data source is new, add a fetch function in `scripts/update_data.py` and wire it to `--all`
3. If `type: 'fred'`, add the series ID → filename mapping in `FredAPI._staticName()` in `js/fred-api.js`
4. If `type: 'static'`, `StaticAPI.fetch(file)` will look for `data/<file>` (falls back to `data/fred_<file>`)

### Chart Config Schema (`CHART_CONFIGS` entries)
```js
{
  id,           // unique string, used for DOM IDs (card-{id}, chart-{id}, etc.)
  title,        // display name
  description,  // subtitle text
  category,     // one of: market | sentiment | forex | commodity | rates | macro
  series: [{
    id,         // series identifier
    label,      // legend label
    type,       // 'fred' | 'cnn' | 'static'
    seriesId,   // FRED series ID (type:'fred' only)
    file,       // filename in data/ (type:'static' only)
    color,      // hex color
    areaStyle,  // boolean — gradient fill under line
    noDecimal,  // boolean — show integer in card current value (S&P500/NASDAQ/DJIA)
    unit,       // string — if defined on series[1], shows secondary value on card (e.g., "· VIX 18.5")
    decimals,   // decimal places for secondary value display
  }],
  unit,         // y-axis unit label (shown once at top of axis)
  format,       // 'percent' | 'integer' | undefined
  koUnit,       // boolean — Korean number formatting (만/억 for payrolls, JOLTS, jobless claims)
  yMin/yMax,    // y-axis bounds (single axis)
  yMinLeft/yMaxLeft/yMinRight/yMaxRight, // dual-axis bounds
  zeroLine,     // boolean — draw dashed line at y=0
  refLines,     // [{value, label, color}] — reference lines
  defaultNormalize, // 'raw' | 'zscore' | 'pct' (default: 'raw')
  statusConfig: {
    type: 'threshold' | 'drawdown',
    window,       // lookback period for drawdown (default: 252 trading days)
    thresholds: [{max?, label, color}]  // matched in order; last entry has no max (catch-all)
  },
  reading,      // string[] — interpretation bullets shown below chart
}
```

### Dual Y-Axis
Charts with multiple series in `raw` mode use left/right dual axes. Z-Score and %변화 modes collapse to a single axis.

### Static JSON Format
All `data/*.json` files follow:
```json
{"updated": "2026-03-04T09:00:00", "dates": ["2020-01-02", ...], "values": [3257.85, ...]}
```
`fetchedAt` in the browser is derived from `new Date(json.updated).getTime()`.

### Fallback Behavior
- `WM2NS` (M2 weekly) → falls back to `M2SL` monthly (`fred_m2.json`) if weekly file missing
- `StaticAPI.fetch(file)` → falls back to `fred_<file>` if `<file>` not found
- CNN F&G → tries `cnn_fg.json` then `fg.json`
- Copper (HG=F): raw value in USD/lb is multiplied by 2204.62 to convert to USD/mt in `update_data.py`
