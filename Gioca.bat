@echo off
title Mammutones al Tigros
cd /d "%~dp0"
where node >nul 2>nul || (echo Serve Node.js: scaricalo da https://nodejs.org ^(versione LTS^) e riprova. & pause & exit /b)
if not exist node_modules (echo Prima installazione, un attimo... & call npm install)
call npm run gioca
pause
