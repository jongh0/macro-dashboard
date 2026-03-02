# -*- coding: utf-8 -*-
"""
update_data.py - 정적 데이터 파일 업데이트 스크립트
실행: python scripts/update_data.py

필요 패키지: pip install requests pandas openpyxl
"""

import json
import os
import sys
from datetime import datetime, date
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
TODAY = date.today().isoformat()


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
def download_gold():
    """금 가격 - FRED GOLDAMGBD228NLBM 폐기(2022)로 Yahoo Finance GC=F 사용"""
    print("\n[4a] 금 가격 다운로드 중 (Yahoo Finance: GC=F)...")
    try:
        import yfinance as yf
        df = yf.download('GC=F', start='2000-01-01', progress=False, auto_adjust=True)
        if df.empty:
            raise ValueError("GC=F 데이터 비어 있음")
        # yfinance >= 0.2 는 MultiIndex 컬럼 반환
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
            "source":  "Yahoo Finance GC=F (Gold Futures Continuous)",
        }
        save_json(data, "gold.json")
        print(f"  -> {len(dates)}개 ({dates[0]} ~ {dates[-1]})")
        return True
    except ImportError:
        print("  FAIL - yfinance 미설치: pip install yfinance")
        return False
    except Exception as e:
        print(f"  FAIL: {e}")
        return False


def compute_krwjpy():
    """원/엔 환율 = DEXKOUS / DEXJPUS × 100 (100엔당 원화) — FRED 교차 계산"""
    print("\n[4b] 원/엔 환율 계산 중 (DEXKOUS ÷ DEXJPUS × 100)...")
    krw_path = OUTPUT_DIR / "fred_usdkrw.json"
    jpy_path = OUTPUT_DIR / "fred_usdjpy.json"
    try:
        with open(krw_path, encoding='utf-8') as f:
            krw_data = json.load(f)
        with open(jpy_path, encoding='utf-8') as f:
            jpy_data = json.load(f)

        krw_map = dict(zip(krw_data['dates'], krw_data['values']))
        jpy_map = dict(zip(jpy_data['dates'], jpy_data['values']))

        common_dates = sorted(set(krw_map.keys()) & set(jpy_map.keys()))
        dates, values = [], []
        for d in common_dates:
            krw = krw_map[d]
            jpy = jpy_map[d]
            if krw and jpy and jpy != 0:
                dates.append(d)
                values.append(round(krw / jpy * 100, 2))  # 100엔당 원화

        data = {
            "updated": TODAY,
            "dates":   dates,
            "values":  values,
            "source":  "FRED DEXKOUS / DEXJPUS × 100 (100엔당 원화)",
        }
        save_json(data, "krwjpy.json")
        print(f"  -> {len(dates)}개 ({dates[0]} ~ {dates[-1]})")
        return True
    except FileNotFoundError as e:
        print(f"  FAIL - 필요 파일 없음 ({e.filename}). 먼저 --fred 실행 필요.")
        return False
    except Exception as e:
        print(f"  FAIL: {e}")
        return False


# ──────────────────────────────────────────────────────
# 5. FRED 데이터 (API 키 필요)
# ──────────────────────────────────────────────────────
FRED_SERIES = {
    "sp500":      ("SP500",     "lin"),
    "vix":        ("VIXCLS",    "lin"),
    "fedfunds":   ("FEDFUNDS",  "lin"),
    "t10y2y":     ("T10Y2Y",    "lin"),
    "dgs10":      ("DGS10",     "lin"),
    "dgs2":       ("DGS2",      "lin"),
    "cpi":        ("CPIAUCSL",  "pc1"),
    "core_cpi":   ("CPILFESL",  "pc1"),
    "m2":         ("M2SL",      "pc1"),
    "m2_level":   ("M2SL",      "lin"),   # 실수치 (십억달러)
    "unrate":     ("UNRATE",    "lin"),
    "pce":        ("PCEPI",     "pc1"),
    "core_pce":   ("PCEPILFE",  "pc1"),
    "umcsent":    ("UMCSENT",   "lin"),
    # ── 신규 추가 ─────────────────────────────
    "dxy":        ("DTWEXBGS",        "lin"),   # 달러 지수
    "wti":        ("DCOILWTICO",      "lin"),   # WTI 원유
    "copper":     ("PCOPPUSDM",       "lin"),   # 구리 가격 (IMF, 월별)
    "housing":    ("CSUSHPINSA",      "lin"),   # 케이스-실러 주택가격지수
    "hyspread":   ("BAMLH0A0HYM2",    "lin"),   # 하이일드 OAS 스프레드
    "t10y3m":     ("T10Y3M",          "lin"),   # 10Y-3M 금리차
    "t10yie":     ("T10YIE",          "lin"),   # 10년 기대인플레이션
    "payems_chg": ("PAYEMS",          "chg"),   # NFP 전월 대비 변화 (천명)
    "icsa":       ("ICSA",            "lin"),   # 초기 실업수당 청구
    "gdp":        ("GDPC1",           "pc1"),   # 실질 GDP YoY 성장률
    "jolts":      ("JTSJOL",          "lin"),   # JOLTS 채용공고
    # ── 환율 / 원자재 (FRED A안) ──────────────
    "dgs30":      ("DGS30",           "lin"),   # 30년물 국채 수익률
    "natgas":     ("DHHNGSP",         "lin"),   # 천연가스 Henry Hub
    "usdjpy":     ("DEXJPUS",         "lin"),   # USD/JPY 환율
    "eurusd":     ("DEXUSEU",         "lin"),   # EUR/USD 환율
    "usdkrw":     ("DEXKOUS",         "lin"),   # USD/KRW 원달러 환율
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
    parser.add_argument("--yahoo",   action="store_true", help="Yahoo Finance 데이터만 (금 등)")
    parser.add_argument("--all",     action="store_true", help="모두 (기본)")
    parser.add_argument("--key",     type=str,            help="FRED API 키 직접 지정")
    args = parser.parse_args()

    if args.key:
        FRED_API_KEY = args.key

    run_all = args.all or not any([args.finra, args.fg, args.fred, args.shiller, args.yahoo])

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
    if run_all or args.fred:
        download_all_fred()
        compute_krwjpy()
    if run_all or args.shiller:
        download_shiller()

    print("\n완료!")
