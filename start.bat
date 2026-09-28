@echo off
setlocal
title CVForge launcher
cd /d "%~dp0"

echo ================================
echo   CVForge - starting up...
echo ================================
echo.

REM --- 1. Ollama ---
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I "ollama.exe" >NUL
if errorlevel 1 (
  where ollama >NUL 2>&1
  if errorlevel 1 (
    echo [!] Ollama not found in PATH. Install from https://ollama.com
    echo     Cloud providers ^(Groq, DeepSeek^) will still work.
  ) else (
    echo [1/3] Starting Ollama...
    start "Ollama" /MIN ollama serve
    timeout /t 4 /nobreak >NUL
  )
) else (
  echo [1/3] Ollama already running.
)

REM --- 2. Static server ---
echo [2/3] Starting local server on port 8000...
start "CVForge server" /MIN cmd /c "python -m http.server 8000"
timeout /t 2 /nobreak >NUL

REM --- 3. Browser ---
echo [3/3] Opening browser...
start "" http://localhost:8000/index.html

echo.
echo ================================
echo   CVForge is running.
echo   URL:  http://localhost:8000
echo   Stop: close the Python and Ollama windows
echo ================================
echo.
pause