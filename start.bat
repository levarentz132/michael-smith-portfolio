@echo off
set "PATH=C:\tools\nodejs;C:\tools\php;C:\tools\composer;%PATH%"
cd /d "%~dp0"
echo Starting Frontend (michael-smith-portfolio) on http://localhost:5173...
npm run dev
