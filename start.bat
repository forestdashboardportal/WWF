@echo off
title WWF Forestry Portal
echo.
echo  ==========================================
echo  WWF-Pakistan Forestry Portal Launcher
echo  ==========================================
echo.
echo  Installing dependencies (first run only)...
call npm install --silent
echo.
echo  Starting server...
echo  Open http://localhost:3000 in your browser
echo.
start http://localhost:3000
node server.js
pause
