@echo off
cd /d "%~dp0"

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 "') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [MacroDashboard] Starting local server...
echo   http://localhost:8080
echo.
echo Press Ctrl+C to stop.
echo.

start "" /b cmd /c "timeout /t 1 >nul && start http://localhost:8080"

where py >nul 2>&1
if %errorlevel% == 0 (
    py -m http.server 8080
) else (
    python -m http.server 8080
)

echo.
echo Server stopped.
pause
