@echo off
title Macro Dashboard - Data Update
cd /d "%~dp0"

if "%~1"=="" (
  echo Usage: update.bat ^<FRED_API_KEY^>
  echo.
  echo Example: update.bat abcdef1234567890abcdef1234567890
  echo.
  echo Get a free API key at: https://fred.stlouisfed.org/docs/api/api_key.html
  pause
  exit /b 1
)

set FRED_KEY=%~1

echo ============================================
echo  Macro Dashboard Data Update
echo  FRED + Yahoo Finance (Gold)
echo ============================================
echo.

echo [1/3] Downloading Yahoo Finance data (Gold)...
python scripts/update_data.py --yahoo
echo.

echo [2/3] Downloading Fear ^& Greed + Shiller + FINRA data...
python scripts/update_data.py --fg --shiller --finra
echo.

echo [3/3] Downloading FRED data...
python scripts/update_data.py --fred --key %FRED_KEY%
echo.

echo ============================================
echo  Done! Refresh the dashboard to see updates.
echo ============================================
pause
