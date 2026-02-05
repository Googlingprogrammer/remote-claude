@echo off
title Claude Code Hub - Setup
echo.
echo   ==========================================
echo     Claude Code Hub - Installation
echo   ==========================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   ERROR: Node.js not found. Install it from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Check Claude Code
where claude >nul 2>nul
if %errorlevel% neq 0 (
    echo   WARNING: Claude Code CLI not found in PATH.
    echo   Make sure it's installed: npm install -g @anthropic-ai/claude-code
    echo.
)

:: Install dependencies
echo   Installing dependencies...
npm install --production
echo.

:: Create .env if it doesn't exist
if not exist .env (
    copy .env.example .env >nul
    echo   Created .env file - you need to add your Discord bot token.
) else (
    echo   .env already exists, skipping.
)

echo.
echo   ==========================================
echo     Setup complete!
echo   ==========================================
echo.
echo   Next steps:
echo.
echo   1. Go to https://discord.com/developers/applications
echo   2. Click "New Application" and name it (e.g. "Claude Hub")
echo   3. Go to "Bot" tab on the left
echo   4. Click "Reset Token" and copy it
echo   5. Open .env in this folder, paste your token
echo   6. Under "Privileged Gateway Intents", enable MESSAGE CONTENT INTENT
echo   7. Create a private Discord server (just for you)
echo   8. Run start.bat - it will print an invite link
echo   9. Use the invite link to add the bot to your server
echo.
pause
