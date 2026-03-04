# Macro Dashboard

거시경제 지표 대시보드. FRED·CNN·FINRA·Yahoo Finance 데이터를 JSON으로 로컬 캐싱해 서버 없이 브라우저에서 실행됩니다.

---

## 지표 목록

| 카테고리 | 지표 |
|---|---|
| **시장** | S&P 500, NASDAQ, 다우존스, VIX, Shiller P/E, CAPE, 금 가격 |
| **심리** | CNN Fear & Greed (주식), Crypto Fear & Greed, 소비자심리지수, FINRA 마진 부채 |
| **금리** | 연방기금금리, 2Y/10Y/30Y 국채, 10Y-2Y/10Y-3M 스프레드, 기대인플레이션, 하이일드 OAS |
| **거시경제** | CPI, PCE, M2 통화량(주간), 실업률, NFP, JOLTS, 실질 GDP, 주택가격지수 |
| **원자재** | WTI 원유, 천연가스(Henry Hub), 구리 |
| **환율** | 달러지수(DXY Broad), USD/JPY, EUR/USD, USD/KRW, KRW/JPY |

---

## 빠른 시작

```bat
start.bat          # 로컬 서버 실행 (http://localhost:8080)
```

또는 Python으로 직접:
```bash
python -m http.server 8080
```

---

## 데이터 업데이트

데이터는 `scripts/update_data.py`로 갱신합니다. 매 시간 실행 권장.

```bash
# 의존성
pip install requests pandas openpyxl yfinance

# 전체 업데이트
python scripts/update_data.py --key YOUR_FRED_API_KEY

# 또는 환경변수로
set FRED_API_KEY=YOUR_KEY
python scripts/update_data.py
```

FRED API 키는 [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html)에서 무료 발급.

Windows 배치 파일:
```bat
update.bat
```

---

## 프로젝트 구조

```
macro-dashboard/
├── index.html
├── css/style.css
├── js/
│   ├── config.js           # 전역 설정
│   ├── app.js              # 메인 앱
│   ├── cache.js            # 브라우저 캐시
│   ├── normalizer.js       # 데이터 정규화
│   ├── fred-api.js         # FRED 정적 파일 로더
│   ├── cnn-api.js          # CNN/Static 로더
│   └── charts/
│       ├── chart-configs.js  # 차트 정의
│       └── chart-factory.js  # ECharts 렌더러
├── data/                   # 정적 JSON (스크립트로 갱신)
├── scripts/update_data.py  # 데이터 업데이트
├── start.bat
└── update.bat
```

---

## 데이터 출처

- [FRED](https://fred.stlouisfed.org) — 금리·GDP·물가·고용·환율 등
- [CNN Fear & Greed](https://www.cnn.com/markets/fear-and-greed) — 주식 시장 심리
- [alternative.me](https://alternative.me/crypto/fear-and-greed-index/) — 크립토 공포·탐욕
- [FINRA](https://www.finra.org/rules-guidance/key-topics/margin-accounts/margin-statistics) — 마진 부채
- [Robert Shiller / Yale](http://www.econ.yale.edu/~shiller/data/) — P/E, CAPE
- [Yahoo Finance](https://finance.yahoo.com) — 금 선물(GC=F)

본 대시보드는 투자 조언이 아닙니다.
