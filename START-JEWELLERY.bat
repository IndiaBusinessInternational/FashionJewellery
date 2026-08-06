@echo off
title IBI Fashion Jewellery - Server
cd /d "%~dp0"

echo.
echo   Starting the IBI Fashion Jewellery server...
echo   Keep this window OPEN. Closing it stops the app.
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo   Node.js was not found on this laptop.
  echo   Install it from https://nodejs.org and run this file again.
  echo.
  pause
  exit /b 1
)

start "" "http://localhost:3100"
node "Backend\server.js"

echo.
echo   The server has stopped.
pause
