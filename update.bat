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
echo  Yahoo Finance + FRED + CNN + FINRA + Shiller
echo ============================================
echo.

echo [1/2] Checking required packages...
where py >nul 2>&1
if %errorlevel% == 0 (
    py -m pip show requests pandas openpyxl yfinance xlrd >nul 2>&1
    if errorlevel 1 py -m pip install requests pandas openpyxl yfinance xlrd --quiet
) else (
    python -m pip show requests pandas openpyxl yfinance xlrd >nul 2>&1
    if errorlevel 1 python -m pip install requests pandas openpyxl yfinance xlrd --quiet
)
echo.

echo [2/2] Updating data...
where py >nul 2>&1
if %errorlevel% == 0 (
    py scripts/update_data.py --all
) else (
    python scripts/update_data.py --all
)
if errorlevel 1 echo   WARNING: Some downloads partially failed
echo.

echo ============================================
echo  Done! Refresh the dashboard in your browser.
echo  https://jongh0.github.io/macro-dashboard/
echo ============================================
pause
