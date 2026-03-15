# -*- coding: utf-8 -*-
"""
update_data.py - 정적 데이터 파일 업데이트 스크립트
실행: python scripts/update_data.py

필요 패키지: pip install requests pandas openpyxl
"""

import json
import os
import sys
from datetime import datetime, date, timezone, timedelta
from pathlib import Path

# Windows 터미널 UTF-8 출력
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

import requests
import pandas as pd

# ──────────────────────────────────────────────────────
# 설정
# ──────────────────────────────────────────────────────
OUTPUT_DIR = Path(__file__).parent.parent / "data"
OUTPUT_DIR.mkdir(exist_ok=True)

FRED_API_KEY = os.environ.get("FRED_API_KEY", "")
HEADERS = {"User-Agent": "Mozilla/5.0 MacroDashboard/1.0"}
KST = timezone(timedelta(hours=9))
TODAY = datetime.now(KST).strftime("%Y-%m-%dT%H:%M:00")


def to_json_dates(df_series, round_digits=4):
    clean = df_series.dropna()
    return {
        "updated": TODAY,
        "dates":   [str(d.date()) if hasattr(d, 'date') else str(d) for d in clean.index],
        "values":  [round(float(v), round_digits) for v in clean.values],
    }


def save_json(data, filename):
    path = OUTPUT_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  OK 저장: {path}")


# ──────────────────────────────────────────────────────
# 1. FINRA 마진 부채
# ──────────────────────────────────────────────────────
def download_finra_margin():
    print("\n[1] FINRA 마진 부채 다운로드 중...")
    url = "https://www.finra.org/sites/default/files/2021-03/margin-statistics.xlsx"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()

        df = pd.read_excel(
            pd.io.common.BytesIO(resp.content),
            skiprows=3,
            engine="openpyxl"
        )
        df.columns = ["date", "margin_debt", "fc_cash", "fc_margin"] + list(df.columns[4:])
        df = df[["date", "margin_debt"]].dropna(subset=["date"])
        df["date"] = pd.to_datetime(df["date"])
        df["margin_debt"] = pd.to_numeric(df["margin_debt"], errors="coerce")
        df = df.set_index("date").sort_index()

        data = to_json_dates(df["margin_debt"], round_digits=0)
        data["unit"] = "millions_usd"
        data["source"] = "FINRA"
        save_json(data, "finra_margin.json")
        print(f"  -> {len(data['dates'])}개 데이터 ({data['dates'][0]} ~ {data['dates'][-1]})")
        return True
    except Exception as e:
        print(f"  FAIL - FINRA 다운로드 실패: {e}")
        return False


# ──────────────────────────────────────────────────────
# 2a. Fear & Greed Index - 크립토 (alternative.me, CORS 지원)
# ──────────────────────────────────────────────────────
def download_fear_greed():
    print("\n[2a] Crypto Fear & Greed Index 다운로드 중 (alternative.me)...")
    url = "https://api.alternative.me/fng/?limit=0&format=json"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        json_data = resp.json()

        raw = list(reversed(json_data.get("data", [])))  # 오래된 순
        dates  = [datetime.utcfromtimestamp(int(d["timestamp"])).strftime("%Y-%m-%d") for d in raw]
        values = [int(d["value"]) for d in raw]

        current = raw[-1] if raw else {}
        data = {
            "updated": TODAY,
            "dates":   dates,
            "values":  values,
            "current": {
                "score":  int(current.get("value", 0)) if current else 0,
                "rating": current.get("value_classification", "") if current else "",
            },
            "source": "alternative.me (Crypto)",
        }
        save_json(data, "fg.json")
        print(f"  -> {len(dates)}개 ({dates[0]} ~ {dates[-1]}), 현재: {data['current']['score']} ({data['current']['rating']})")
        return True
    except Exception as e:
        print(f"  FAIL - Crypto Fear & Greed 다운로드 실패: {e}")
        return False


# ──────────────────────────────────────────────────────
# 2b. Fear & Greed Index - 주식 시장 (CNN)
# ──────────────────────────────────────────────────────
def download_cnn_fear_greed():
    print("\n[2b] Stock Fear & Greed Index 다운로드 중 (CNN)...")
    url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        json_data = resp.json()

        # 현재값
        current = json_data.get("fear_and_greed", {})
        score  = current.get("score", 0)
        rating = current.get("rating", "")

        # 역사 데이터 (x: Unix ms, y: score)
        hist = json_data.get("fear_and_greed_historical", {}).get("data", [])
        hist_sorted = sorted(hist, key=lambda d: d["x"])
        dates  = [datetime.utcfromtimestamp(d["x"] / 1000).strftime("%Y-%m-%d") for d in hist_sorted]
        values = [round(float(d["y"]), 1) for d in hist_sorted]

        data = {
            "updated": TODAY,
            "dates":   dates,
            "values":  values,
            "current": {
                "score":  round(float(score), 1),
                "rating": rating,
            },
            "source": "CNN Fear & Greed Index (Stock Market)",
        }
        save_json(data, "cnn_fg.json")
        print(f"  -> {len(dates)}개 ({dates[0]} ~ {dates[-1]}), 현재: {data['current']['score']} ({data['current']['rating']})")
        return True
    except Exception as e:
        print(f"  FAIL - CNN Fear & Greed 다운로드 실패: {e}")
        return False


# ──────────────────────────────────────────────────────
# 3. Shiller P/E & CAPE (Robert Shiller, Yale)
# ──────────────────────────────────────────────────────
def download_shiller():
    print("\n[3] Shiller P/E & CAPE 다운로드 중 (Yale)...")
    url = "http://www.econ.yale.edu/~shiller/data/ie_data.xls"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()

        df = pd.read_excel(
            pd.io.common.BytesIO(resp.content),
            sheet_name="Data",
            header=7,
            engine="xlrd",
        )

        def parse_date(d):
            try:
                d = float(d)
                year = int(d)
                month = round((d - year) * 100)
                month = max(1, min(12, month))
                return f"{year:04d}-{month:02d}-01"
            except Exception:
                return None

        df["date_str"] = df["Date"].apply(parse_date)
        df = df.dropna(subset=["date_str", "P"])
        df["P"]    = pd.to_numeric(df["P"],    errors="coerce")
        df["E"]    = pd.to_numeric(df["E"],    errors="coerce")
        df["CAPE"] = pd.to_numeric(df["CAPE"], errors="coerce")
        df["PE"]   = (df["P"] / df["E"]).round(2)

        # P/E ratio
        pe = df[["date_str", "PE"]].dropna()
        save_json({
            "updated": TODAY,
            "dates":   pe["date_str"].tolist(),
            "values":  pe["PE"].tolist(),
            "source":  "Robert Shiller, Yale",
        }, "shiller_pe_ratio.json")
        print(f"  P/E: {len(pe)}개 ({pe.iloc[0]['date_str']} ~ {pe.iloc[-1]['date_str']})")

        # Shiller CAPE
        cape = df[["date_str", "CAPE"]].dropna()
        save_json({
            "updated": TODAY,
            "dates":   cape["date_str"].tolist(),
            "values":  cape["CAPE"].round(2).tolist(),
            "source":  "Robert Shiller, Yale (CAPE = 10년 실질이익 기준 P/E)",
        }, "shiller_cape.json")
        print(f"  CAPE: {len(cape)}개 ({cape.iloc[0]['date_str']} ~ {cape.iloc[-1]['date_str']})")

        return True
    except Exception as e:
        print(f"  FAIL - Shiller 다운로드 실패: {e}")
        return False


# ──────────────────────────────────────────────────────
# 4. Yahoo Finance 데이터 (yfinance 라이브러리 필요)
#    pip install yfinance
# ──────────────────────────────────────────────────────
def _download_yahoo_ohlc(ticker, filename, label):
    """Yahoo Finance에서 일별 종가를 받아 JSON으로 저장하는 공통 헬퍼."""
    import yfinance as yf
    df = yf.download(ticker, start='2000-01-01', progress=False, auto_adjust=True)
    if df.empty:
        raise ValueError(f"{ticker} 데이터 비어 있음")
    close = df['Close']
    if isinstance(close, pd.DataFrame):
        close = close.iloc[:, 0]
    close = close.dropna()
    dates  = [d.strftime('%Y-%m-%d') for d in close.index]
    values = [round(float(v), 2) for v in close.values]
    data = {
        "updated": TODAY,
        "dates":   dates,
        "values":  values,
        "source":  f"Yahoo Finance {ticker} ({label})",
    }
    save_json(data, filename)
    print(f"  -> {ticker}: {len(dates)}개 ({dates[0]} ~ {dates[-1]})")
    return True


def download_gold():
    """금 가격 - FRED GOLDAMGBD228NLBM 폐기(2022)로 Yahoo Finance GC=F 사용"""
    print("\n[4a] 금 가격 다운로드 중 (Yahoo Finance: GC=F)...")
    try:
        import yfinance  # noqa: F401 – ImportError 체크용
        return _download_yahoo_ohlc('GC=F', 'gold.json', 'Gold Futures Continuous')
    except ImportError:
        print("  FAIL - yfinance 미설치: pip install yfinance")
        return False
    except Exception as e:
        print(f"  FAIL: {e}")
        return False


def download_silver():
    """은 가격 - Yahoo Finance SI=F (Silver Futures Continuous)"""
    print("\n[4b] 은 가격 다운로드 중 (Yahoo Finance: SI=F)...")
    try:
        import yfinance  # noqa: F401
        return _download_yahoo_ohlc('SI=F', 'silver.json', 'Silver Futures Continuous')
    except ImportError:
        print("  FAIL - yfinance 미설치: pip install yfinance")
        return False
    except Exception as e:
        print(f"  FAIL: {e}")
        return False


# ──────────────────────────────────────────────────────
# 4c. 주요 시장 지수 & 원자재 (yfinance — FRED 대비 1~2일 빠름)
# ──────────────────────────────────────────────────────
MARKET_TICKERS = {
    "sp500":   ("^GSPC",  "S&P 500 Index"),
    "nasdaq":  ("^IXIC",  "NASDAQ Composite"),
    "djia":    ("^DJI",   "Dow Jones Industrial Average"),
    "vix":     ("^VIX",   "CBOE Volatility Index"),
    "wti":     ("CL=F",   "WTI Crude Oil Futures"),
    "copper":  ("HG=F",   "Copper Futures (USD/lb → USD/mt 변환)"),
    "natgas":  ("NG=F",   "Henry Hub Natural Gas Futures"),
}

def download_market_tickers():
    """주요 지수·원자재 — Yahoo Finance (FRED 대비 1~2일 빠른 전일 종가)"""
    print("\n[4c] 시장 지수 & 원자재 다운로드 중 (Yahoo Finance)...")
    try:
        import yfinance as yf
    except ImportError:
        print("  FAIL - yfinance 미설치: pip install yfinance")
        return False

    results = {}
    for name, (ticker, label) in MARKET_TICKERS.items():
        try:
            df = yf.download(ticker, start='2000-01-01', progress=False, auto_adjust=True)
            if df.empty:
                raise ValueError(f"{ticker} 데이터 비어 있음")
            close = df['Close']
            if isinstance(close, pd.DataFrame):
                close = close.iloc[:, 0]
            close = close.dropna()
            dates  = [d.strftime('%Y-%m-%d') for d in close.index]
            values = [round(float(v), 4) for v in close.values]

            # 구리: Yahoo Finance HG=F는 USD/lb → USD/mt 변환 (×2204.62)
            if name == 'copper':
                values = [round(v * 2204.62, 2) for v in values]

            data = {
                "updated": TODAY,
                "dates":   dates,
                "values":  values,
                "source":  f"Yahoo Finance {ticker} ({label})",
            }
            save_json(data, f"{name}.json")
            print(f"  -> {ticker}: {len(dates)}개 ({dates[0]} ~ {dates[-1]})")
            results[name] = True
        except Exception as e:
            print(f"  FAIL [{ticker}]: {e}")
            results[name] = False

    return all(results.values())


# ──────────────────────────────────────────────────────
# 5. Yahoo Finance 환율 데이터 (yfinance 라이브러리 필요)
#    FRED H.10 주간 발표 대비 약 1주 빠른 전일 종가 기준
# ──────────────────────────────────────────────────────
FOREX_PAIRS = {
    "usdkrw": "USDKRW=X",   # 원/달러
    "usdjpy":  "USDJPY=X",  # 달러/엔
    "eurusd":  "EURUSD=X",  # 유로/달러
}

def download_forex_yahoo():
    """환율 데이터 — Yahoo Finance (전일 종가, FRED H.10 대비 약 1주 빠름)"""
    print("\n[5] 환율 다운로드 중 (Yahoo Finance)...")
    try:
        import yfinance as yf
    except ImportError:
        print("  FAIL - yfinance 미설치: pip install yfinance")
        return False

    fetched = {}
    for name, ticker in FOREX_PAIRS.items():
        try:
            df = yf.download(ticker, start='2000-01-01', progress=False, auto_adjust=True)
            if df.empty:
                raise ValueError(f"{ticker} 데이터 비어 있음")
            close = df['Close']
            if isinstance(close, pd.DataFrame):
                close = close.iloc[:, 0]
            close = close.dropna()
            dates  = [d.strftime('%Y-%m-%d') for d in close.index]
            values = [round(float(v), 4) for v in close.values]
            data = {
                "updated": TODAY,
                "dates":   dates,
                "values":  values,
                "source":  f"Yahoo Finance {ticker} (전일 종가 기준)",
            }
            save_json(data, f"yahoo_{name}.json")
            print(f"  -> {ticker}: {len(dates)}개 ({dates[0]} ~ {dates[-1]})")
            fetched[name] = {"dates": dates, "values": values}
        except Exception as e:
            print(f"  FAIL [{ticker}]: {e}")

    # KRW/JPY 교차 계산 (USDKRW / USDJPY × 100 = 100엔당 원화)
    if "usdkrw" in fetched and "usdjpy" in fetched:
        krw_map = dict(zip(fetched["usdkrw"]["dates"], fetched["usdkrw"]["values"]))
        jpy_map = dict(zip(fetched["usdjpy"]["dates"], fetched["usdjpy"]["values"]))
        common  = sorted(set(krw_map) & set(jpy_map))
        dates_out, vals_out = [], []
        for d in common:
            k, j = krw_map[d], jpy_map[d]
            if k and j and j != 0:
                dates_out.append(d)
                vals_out.append(round(k / j * 100, 2))
        save_json({
            "updated": TODAY,
            "dates":   dates_out,
            "values":  vals_out,
            "source":  "Yahoo Finance USDKRW=X / USDJPY=X × 100 (100엔당 원화)",
        }, "krwjpy.json")
        print(f"  -> KRW/JPY (100엔): {len(dates_out)}개 ({dates_out[-1]}까지)")

    return True


# ──────────────────────────────────────────────────────
# 5. FRED 데이터 (API 키 필요)
# ──────────────────────────────────────────────────────
FRED_SERIES = {
    # ── 금리 ──────────────────────────────────
    "fedfunds":        ("FEDFUNDS",       "lin"),   # 연방기금금리
    "t10y2y":          ("T10Y2Y",         "lin"),   # 10Y-2Y 금리차
    "dgs10":           ("DGS10",          "lin"),   # 10년물 국채 수익률
    "dgs2":            ("DGS2",           "lin"),   # 2년물 국채 수익률
    "dgs30":           ("DGS30",          "lin"),   # 30년물 국채 수익률
    "t10y3m":          ("T10Y3M",         "lin"),   # 10Y-3M 금리차
    "t10yie":          ("T10YIE",         "lin"),   # 10년 기대인플레이션
    "hyspread":        ("BAMLH0A0HYM2",   "lin"),   # 하이일드 OAS 스프레드
    # ── 물가 ──────────────────────────────────
    "cpi":             ("CPIAUCSL",       "pc1"),   # CPI YoY
    "core_cpi":        ("CPILFESL",       "pc1"),   # Core CPI YoY
    "pce":             ("PCEPI",          "pc1"),   # PCE YoY
    "core_pce":        ("PCEPILFE",       "pc1"),   # Core PCE YoY
    # ── 고용 ──────────────────────────────────
    "unrate":          ("UNRATE",         "lin"),   # 실업률
    "payems_chg":      ("PAYEMS",         "chg"),   # NFP 전월 대비 변화
    "icsa":            ("ICSA",           "lin"),   # 초기 실업수당 청구
    "jolts":           ("JTSJOL",         "lin"),   # JOLTS 채용공고
    # ── 거시경제 ──────────────────────────────
    "gdp":             ("GDPC1",          "pc1"),   # 실질 GDP YoY 성장률
    "rsafs":           ("RSAFS",          "pc1"),   # 소매판매 YoY
    "indpro":          ("INDPRO",         "pc1"),   # 산업생산 YoY
    "umcsent":         ("UMCSENT",        "lin"),   # 미시간대 소비자심리
    "housing":         ("CSUSHPINSA",     "lin"),   # 케이스-실러 주택가격지수
    # ── 물가 (추가) ───────────────────────────
    "ppi":             ("PPIFIS",         "pc1"),   # 생산자물가 YoY
    # ── 유동성 ────────────────────────────────
    "walcl":           ("WALCL",          "lin"),   # 연준 대차대조표 (십억달러)
    "rrpontsyd":       ("RRPONTSYD",      "lin"),   # 역레포(RRP) 잔고 (십억달러)
    "wdtgal":          ("WDTGAL",         "lin"),   # 재무부 TGA 잔고 (십억달러)
    "m2":              ("M2SL",           "pc1"),   # M2 YoY (월별 폴백용)
    "m2_level":        ("M2SL",           "lin"),   # M2 실수치 (십억달러)
    "m2_weekly":       ("WM2NS",          "pc1"),   # M2 주간 YoY 변화율
    "m2_weekly_level": ("WM2NS",          "lin"),   # M2 주간 절대값
    # ── 달러 지수 (연준 Broad — ICE DXY와 다른 지수) ──
    "dxy":             ("DTWEXBGS",       "lin"),
    # ── SP500·VIX·NASDAQ·DJIA·WTI·구리·천연가스 →
    #    Yahoo Finance로 이전 (download_market_tickers)
    # ── 환율 → Yahoo Finance로 이전 (download_forex_yahoo)
}

FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"


def download_fred_series(name, series_id, units, start="2000-01-01"):
    if not FRED_API_KEY:
        return False
    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "observation_start": start,
        "units": units,
        "sort_order": "asc",
    }
    try:
        resp = requests.get(FRED_BASE, params=params, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        obs = resp.json().get("observations", [])
        dates  = [o["date"] for o in obs if o["value"] != "."]
        values = [round(float(o["value"]), 4) for o in obs if o["value"] != "."]
        data = {
            "updated":   TODAY,
            "dates":     dates,
            "values":    values,
            "series_id": series_id,
            "units":     units,
            "source":    "FRED",
        }
        save_json(data, f"fred_{name}.json")
        return True
    except Exception as e:
        print(f"  FAIL [{series_id}]: {e}")
        return False


def download_all_fred():
    if not FRED_API_KEY:
        print("\n[3] FRED API 키 없음 - 스킵 (--key 옵션 또는 FRED_API_KEY 환경변수 설정 필요)")
        return
    print(f"\n[3] FRED 데이터 다운로드 중... (키: {FRED_API_KEY[:8]}***)")
    for name, (series_id, units) in FRED_SERIES.items():
        print(f"  -> {series_id} ({units})...", end=" ", flush=True)
        ok = download_fred_series(name, series_id, units)
        print("OK" if ok else "FAIL")
    calc_net_liquidity()


def calc_net_liquidity():
    """순유동성 = 연준 자산(WALCL) - RRP(RRPONTSYD) - TGA(WDTGAL) 계산 후 저장"""
    print("  -> 순유동성 계산 중...", end=" ", flush=True)
    try:
        def load(filename):
            path = OUTPUT_DIR / filename
            with open(path, encoding="utf-8") as f:
                j = json.load(f)
            return pd.Series(
                j["values"],
                index=pd.to_datetime(j["dates"]),
                dtype=float,
            )

        walcl = load("fred_walcl.json")
        rrp   = load("fred_rrpontsyd.json")
        tga   = load("fred_wdtgal.json")

        # 단위 통일: 모두 십억달러($B)로 변환
        # WALCL: 백만달러 → /1000 → 십억달러
        # RRPONTSYD: 이미 십억달러
        # WDTGAL: 백만달러 → /1000 → 십억달러
        walcl_b = walcl / 1000
        tga_b   = tga   / 1000

        # RRP(일별) → 주간 마지막값으로 리샘플
        rrp_w = rrp.resample("W-WED").last()

        # 세 시리즈를 날짜 기준 병합 (inner: 공통 날짜만)
        df = pd.DataFrame({"walcl": walcl_b, "rrp": rrp_w, "tga": tga_b}).dropna()
        df["net"] = df["walcl"] - df["rrp"] - df["tga"]

        data = to_json_dates(df["net"], round_digits=2)
        data["source"] = "FRED (WALCL - RRPONTSYD - WDTGAL)"
        save_json(data, "fred_net_liquidity.json")
        print(f"OK ({len(data['dates'])}개, {data['dates'][0]} ~ {data['dates'][-1]})")
    except Exception as e:
        print(f"FAIL: {e}")


# ──────────────────────────────────────────────────────
# 6. Google Trends 공포 지수
# ──────────────────────────────────────────────────────
FEAR_KEYWORDS = [
    "recession",
    "inflation",
    "tariff",
    "financial crisis",
    "stock market crash",
    "unemployment",
]


def download_fear_sentiment():
    print("\n[6] Google Trends 공포 지수 다운로드 중...")
    import time
    try:
        from pytrends.request import TrendReq
    except ImportError:
        print("  FAIL: pip install pytrends 필요")
        return False

    pytrends = TrendReq(hl='en-US', tz=0)
    end_date  = datetime.now(KST).strftime('%Y-%m-%d')
    timeframe = f'2020-01-01 {end_date}'

    series_list = []
    # pytrends는 한 번에 최대 5개 키워드
    for i in range(0, len(FEAR_KEYWORDS), 5):
        batch = FEAR_KEYWORDS[i:i + 5]
        print(f"  -> {batch}...", end=" ", flush=True)
        try:
            pytrends.build_payload(batch, timeframe=timeframe, geo='US')
            df = pytrends.interest_over_time()
            if df.empty:
                print("SKIP (empty)")
                continue
            if 'isPartial' in df.columns:
                df = df.drop(columns=['isPartial'])
            for col in df.columns:
                series_list.append(df[col].rename(col))
            print(f"OK ({len(df)}주)")
        except Exception as e:
            print(f"FAIL: {e}")
        time.sleep(3)

    if not series_list:
        print("  FAIL: 유효한 데이터 없음")
        return False

    composite = pd.concat(series_list, axis=1).mean(axis=1).dropna()

    data = to_json_dates(composite, round_digits=2)
    data["source"] = "Google Trends US (공포·불확실성 키워드 평균)"
    save_json(data, "fear_sentiment.json")
    print(f"  -> 공포 지수 저장: {len(data['dates'])}개 ({data['dates'][0]} ~ {data['dates'][-1]})")
    return True


# ──────────────────────────────────────────────────────
# 메인
# ──────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="매크로 대시보드 데이터 업데이트")
    parser.add_argument("--finra",   action="store_true", help="FINRA 마진 부채만")
    parser.add_argument("--fg",      action="store_true", help="Fear & Greed 둘 다 (크립토 + CNN 주식)")
    parser.add_argument("--fred",    action="store_true", help="FRED 데이터만")
    parser.add_argument("--shiller", action="store_true", help="Shiller P/E + CAPE만")
    parser.add_argument("--yahoo",   action="store_true", help="Yahoo Finance 데이터만 (금, 은)")
    parser.add_argument("--market",  action="store_true", help="Yahoo Finance 시장 지수·원자재 (S&P·NASDAQ·DJIA·VIX·WTI·구리·천연가스)")
    parser.add_argument("--forex",   action="store_true", help="Yahoo Finance 환율 데이터만")
    parser.add_argument("--gdelt",   action="store_true", help="GDELT 뉴스 센티먼트만")
    parser.add_argument("--all",     action="store_true", help="모두 (기본)")
    parser.add_argument("--key",     type=str,            help="FRED API 키 직접 지정")
    args = parser.parse_args()

    if args.key:
        FRED_API_KEY = args.key

    run_all = args.all or not any([args.finra, args.fg, args.fred, args.shiller, args.yahoo, args.market, args.forex, args.gdelt])

    print("=" * 50)
    print("매크로 대시보드 데이터 업데이트")
    print(f"날짜: {TODAY}")
    print("=" * 50)

    if run_all or args.finra:
        download_finra_margin()
    if run_all or args.fg:
        download_fear_greed()
        download_cnn_fear_greed()
    if run_all or args.yahoo:
        download_gold()
        download_silver()
    if run_all or args.market:
        download_market_tickers()
    if run_all or args.forex:
        download_forex_yahoo()
    if run_all or args.fred:
        download_all_fred()
    if run_all or args.shiller:
        download_shiller()
    if run_all or args.gdelt:
        download_fear_sentiment()

    print("\n완료!")
