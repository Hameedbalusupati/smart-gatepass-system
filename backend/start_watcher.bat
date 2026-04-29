@echo off

REM Move to the folder where this .bat file is located
cd /d %~dp0

echo ================================
echo   Starting Excel Watcher...
echo ================================

REM Run watcher
python watcher.py

echo.
echo Watcher stopped.
pause