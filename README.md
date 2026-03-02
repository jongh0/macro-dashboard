# Macro Dashboard

거시경제 지표를 한눈에 보는 정적 웹 대시보드입니다.
FRED, CNN Fear & Greed, FINRA, Yahoo Finance 등 공개 데이터를 JSON으로 로컬 캐싱하여 서버 없이 브라우저에서 바로 실행됩니다.

---

## 주요 지표

| 카테고리 | 지표 |
|---|---|
| **시장** | S&P 500, VIX, Shiller P/E, CAPE, 금 가격 |
| **심리/수급** | CNN Fear & Greed, Crypto Fear & Greed, FINRA 마진 부채 |
| **금리** | 연방기금금리, 2Y/10Y/30Y 국채, 10Y-2Y/10Y-3M 스프레드, 10년 기대인플레이션, 하이일드 OAS |
| **거시경제** | CPI, Core CPI, PCE, Core PCE, M2, 실업률, NFP, JOLTS, 미시건 소비자심리, 실질 GDP |
| **원자재** | WTI 원유, 천연가스(Henry Hub), 구리 |
| **환율** | DXY 달러지수, USD/JPY, EUR/USD, USD/KRW, KRW/JPY(100엔당) |

---

## 빠른 시작

### 1. 브라우저에서 직접 열기

```
index.html 을 브라우저로 열면 됩니다.
```

`data/` 폴더의 JSON 파일이 정적 데이터 소스입니다. 실시간 FRED 데이터는 브라우저에서 직접 API를 호출합니다.

### 2. 로컬 서버로 실행 (권장)

```bat
start.bat
```

또는 Python으로 직접 실행:

```bash
python -m http.server 8080
# http://localhost:8080 접속
```

---

## FRED API 키 설정

실시간 경제 지표(금리, CPI 등)를 보려면 FRED API 키가 필요합니다.

1. [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html) 에서 무료 발급
2. 대시보드 우측 상단 **⚙ 설정** 에서 키 입력
   (키는 브라우저 localStorage에만 저장, 외부 전송 없음)

> **주의:** `js/config.js`에 하드코딩된 API 키가 있다면 공개 저장소에 올리기 전에 제거하거나 빈 문자열(`''`)로 바꾸세요.

---

## 정적 데이터 업데이트

FINRA 마진 부채, Shiller P/E, 금 가격, Fear & Greed 등 정적 JSON 파일은 Python 스크립트로 갱신합니다.

### 의존성 설치

```bash
pip install requests pandas openpyxl yfinance
```

### 실행

```bash
# 전체 업데이트
python scripts/update_data.py

# 특정 항목만
python scripts/update_data.py --fred     # FRED 데이터
python scripts/update_data.py --finra    # FINRA 마진 부채
python scripts/update_data.py --fg       # Fear & Greed (크립토 + CNN)
python scripts/update_data.py --shiller  # Shiller P/E & CAPE
python scripts/update_data.py --yahoo    # 금 가격 (yfinance)

# FRED API 키 직접 지정
python scripts/update_data.py --key YOUR_FRED_API_KEY
```

또는 Windows 배치 파일:

```bat
update.bat
```

FRED API 키는 환경변수로도 설정 가능합니다:

```bat
set FRED_API_KEY=YOUR_API_KEY
python scripts/update_data.py
```

---

## 프로젝트 구조

```
macro-dashboard/
├── index.html              # 메인 페이지
├── css/
│   └── style.css           # 스타일시트
├── js/
│   ├── config.js           # 설정 (API 키, 캐시 TTL 등)
│   ├── app.js              # 앱 진입점
│   ├── cache.js            # 브라우저 캐시 관리
│   ├── normalizer.js       # 데이터 정규화
│   ├── fred-api.js         # FRED API 클라이언트
│   ├── cnn-api.js          # CNN Fear & Greed 클라이언트
│   └── charts/
│       ├── chart-configs.js  # 차트 설정 목록
│       └── chart-factory.js  # ECharts 차트 생성
├── data/                   # 정적 JSON 데이터 (스크립트로 갱신)
│   ├── fred_*.json
│   ├── cnn_fg.json
│   ├── fg.json
│   ├── finra_margin.json
│   ├── gold.json
│   ├── shiller_*.json
│   └── ...
├── scripts/
│   └── update_data.py      # 데이터 업데이트 스크립트
├── start.bat               # 로컬 서버 실행 (Windows)
└── update.bat              # 데이터 업데이트 실행 (Windows)
```

---

## 데이터 출처

- [FRED](https://fred.stlouisfed.org) - Federal Reserve Economic Data
- [CNN Fear & Greed](https://www.cnn.com/markets/fear-and-greed) - 주식시장 심리 지수
- [alternative.me](https://alternative.me/crypto/fear-and-greed-index/) - 크립토 공포·탐욕 지수
- [FINRA](https://www.finra.org/rules-guidance/key-topics/margin-accounts/margin-statistics) - 마진 부채 통계
- [Robert Shiller / Yale](http://www.econ.yale.edu/~shiller/data/) - Shiller P/E & CAPE
- [Yahoo Finance](https://finance.yahoo.com) - 금 선물(GC=F)

---

본 대시보드는 투자 조언이 아닙니다.
