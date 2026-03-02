@echo off
title Macro Dashboard
cd /d "%~dp0"
echo ============================================
echo  Macro Dashboard - http://localhost:8080
echo  Close this window to stop the server.
echo ============================================
start /b "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8080"
python -m http.server 8080
