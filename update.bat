@echo off
title Macro Dashboard - Data Update
cd /d "%~dp0"

if "%FRED_API_KEY%"=="" (
  if "%~1"=="" (
    echo ============================================
    echo  Macro Dashboard Data Update
    echo ============================================
    echo.
    echo FRED API key required.
    echo.
    echo Usage:
    echo   update.bat YOUR_FRED_API_KEY
    echo.
    echo   Or set environment variable:
    echo   set FRED_API_KEY=abcdef1234567890
    echo   update.bat
    echo.
    echo Get a free API key at:
    echo   https://fred.stlouisfed.org/docs/api/api_key.html
    echo.
    pause
    exit /b 1
  )
  set FRED_API_KEY=%~1
)

echo ============================================
echo  Macro Dashboard Data Update
echo  FRED + Yahoo Finance + CNN + FINRA + Shiller
echo ============================================
echo.

echo [1/4] Yahoo Finance - Gold, Silver ^(GC=F, SI=F^)...
python scripts/update_data.py --yahoo
if errorlevel 1 echo   WARNING: Yahoo Finance download partially failed
echo.

echo [2/4] Yahoo Finance - Forex ^(USDKRW, USDJPY, EURUSD, KRWJPY^)...
python scripts/update_data.py --forex
if errorlevel 1 echo   WARNING: Forex download partially failed
echo.

echo [3/4] CNN Fear ^& Greed + Shiller P/E + FINRA Margin Debt...
python scripts/update_data.py --fg --shiller --finra
if errorlevel 1 echo   WARNING: Some downloads partially failed
echo.

echo [4/4] FRED economic data ^(SP500, rates, CPI, employment...^)
python scripts/update_data.py --fred
if errorlevel 1 echo   WARNING: FRED download partially failed
echo.

echo ============================================
echo  Done! Refresh the dashboard in your browser.
echo  https://jongh0.github.io/macro-dashboard/
echo ============================================
pause
