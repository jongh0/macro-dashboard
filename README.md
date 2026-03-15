# Macro Dashboard

거시경제 지표 대시보드. FRED·CNN·FINRA·Yahoo Finance 데이터를 JSON으로 로컬 캐싱해 서버 없이 브라우저에서 실행됩니다.

**라이브 데모:** https://jongh0.github.io/macro-dashboard/

---

## 지표 목록

| 카테고리 | 지표 |
|---|---|
| **시장** | S&P 500, NASDAQ, 다우존스, VIX |
| **심리** | CNN Fear & Greed (주식), Crypto Fear & Greed |
| **환율** | USD/KRW, KRW/JPY, USD/JPY, EUR/USD |
| **원자재** | 금, 은, 구리, WTI 원유, 천연가스(Henry Hub) |
| **금리** | 연방기금금리, 2Y/10Y/30Y 국채, 10Y-2Y/10Y-3M 스프레드, 하이일드 OAS |
| **거시경제** | 달러지수(Broad), 소비자심리지수, 실질 GDP, 실업률, NFP, JOLTS, 실업수당 청구, CPI, PCE, 기대인플레이션(BEI), M2 통화량(주간), 주택가격지수 |

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

FRED API 키는 [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html)에서 무료 발급.

**Windows 배치 파일 (권장):**
```bat
update.bat YOUR_FRED_API_KEY
```

환경변수로 키를 설정한 경우:
```bat
set FRED_API_KEY=YOUR_KEY
update.bat
```

**직접 실행:**
```bash
# 의존성 설치
pip install requests pandas openpyxl yfinance xlrd

# 전체 업데이트
python scripts/update_data.py --all --key YOUR_FRED_API_KEY

# 개별 실행
python scripts/update_data.py --market   # S&P 500·NASDAQ·DJIA·VIX·WTI·구리·천연가스 (Yahoo Finance)
python scripts/update_data.py --yahoo    # 금, 은 (Yahoo Finance)
python scripts/update_data.py --forex    # 환율 USD/KRW, USD/JPY, EUR/USD
python scripts/update_data.py --fg       # Fear & Greed (CNN + 크립토)
python scripts/update_data.py --shiller  # Shiller P/E
python scripts/update_data.py --finra    # FINRA 마진 부채
python scripts/update_data.py --fred     # FRED 전체 (API 키 필요)
```

GitHub Actions로 1시간마다 자동 갱신 (`.github/workflows/update-data.yml`).

---

## 프로젝트 구조

```
macro-dashboard/
├── index.html
├── css/style.css
├── js/
│   ├── config.js           # 전역 설정 및 카테고리 정의
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
├── .github/workflows/      # GitHub Actions 자동화
├── start.bat
└── update.bat
```

---

## 데이터 출처

| 소스 | 지표 | 비고 |
|---|---|---|
| [Yahoo Finance](https://finance.yahoo.com) | S&P 500(^GSPC), NASDAQ(^IXIC), DJIA(^DJI), VIX(^VIX), WTI(CL=F), 구리(HG=F), 천연가스(NG=F), 금(GC=F), 은(SI=F), 환율 | FRED 대비 1~2일 빠른 전일 종가 |
| [FRED](https://fred.stlouisfed.org) | 금리·GDP·물가·고용·M2·달러지수(Broad)·하이일드 스프레드·주택가격 등 | API 키 필요 |
| [CNN Fear & Greed](https://www.cnn.com/markets/fear-and-greed) | 주식 시장 심리 | |
| [alternative.me](https://alternative.me/crypto/fear-and-greed-index/) | 크립토 공포·탐욕 | |
| [FINRA](https://www.finra.org/rules-guidance/key-topics/margin-accounts/margin-statistics) | 마진 부채 | |
| [Robert Shiller / Yale](http://www.econ.yale.edu/~shiller/data/) | P/E | 약 1~2개월 지연 |

본 대시보드는 투자 조언이 아닙니다.
