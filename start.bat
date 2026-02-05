@echo off
title Claude Code Hub
echo.
echo   Starting Claude Code Hub...
echo   (minimize this window - keep it running)
echo.

:start
node bot.js
echo.
echo   Bot stopped. Restarting in 5 seconds...
echo   Press Ctrl+C to exit.
timeout /t 5 /nobreak >nul
goto start
