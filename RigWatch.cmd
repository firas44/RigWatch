@echo off
rem RigWatch launcher: double-click to start. Installs Node.js LTS (with your OK) if it is missing.
setlocal
cd /d "%~dp0"
title RigWatch

where node >nul 2>nul
if not errorlevel 1 goto run
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%PATH%;%ProgramFiles%\nodejs" & goto run

echo.
echo  RigWatch needs Node.js (version 18 or newer) and it is not installed.
echo.
where winget >nul 2>nul
if errorlevel 1 goto manual
choice /c YN /m " Install Node.js LTS now with winget"
if errorlevel 2 goto manual
winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements
set "PATH=%PATH%;%ProgramFiles%\nodejs"
where node >nul 2>nul
if errorlevel 1 goto manual

:run
node server.js --open %*
if errorlevel 1 pause
goto :eof

:manual
echo.
echo  Download the LTS version from https://nodejs.org , install it, then run RigWatch.cmd again.
echo.
pause
