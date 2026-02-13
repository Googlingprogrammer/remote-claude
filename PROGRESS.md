# Project Progress: Remote Claude

## Status: MVP Complete

---

## Completed Features

### Core Bot Infrastructure
- [x] Discord.js v14 client setup
- [x] DM-only message handling
- [x] Environment configuration (dotenv)
- [x] Graceful shutdown handling (SIGINT/SIGTERM)

### Project Management
- [x] Add projects (`!add <name> <path> [desc]`)
- [x] Remove projects (`!remove <name>`)
- [x] List projects (`!projects`)
- [x] Switch active project (`!use <name>`)
- [x] Persistent config storage (config.json)
- [x] Channel-to-project mapping

### Claude Code Integration
- [x] Spawn Claude CLI as child process
- [x] Pass prompts via `-p` flag
- [x] Text output format (`--output-format text`)
- [x] Conversation continuation (`-c` flag)
- [x] Fresh start option (`!clear`)
- [x] Process termination (`!stop`)
- [x] ANSI escape code stripping
- [x] Environment setup (NO_COLOR, FORCE_COLOR=0)

### User Experience
- [x] Visual feedback (hourglass while processing)
- [x] Success/failure reactions (checkmark/X)
- [x] Typing indicator during processing
- [x] Long message splitting (>2000 chars)
- [x] Natural split points (paragraphs, lines)
- [x] Error message formatting
- [x] Status command (`!status`)
- [x] Help command (`!help`)

### Security
- [x] User allowlist support
- [x] DM-only mode (ignores server messages)
- [x] Bot-message filtering

### Installation
- [x] install.bat setup script
- [x] Node.js detection
- [x] Claude CLI detection (warning)
- [x] .env template creation
- [x] start.bat launcher
- [x] Invite URL generation on startup

---

## Pending / Future Enhancements

### High Priority
- [ ] Slash commands (Discord's modern command system)
- [ ] Better error handling for Claude CLI failures
- [ ] Timeout handling for long-running processes
- [ ] Message queue for rapid prompts

### Medium Priority
- [ ] File attachment support (send files to Claude)
- [ ] Image input support (Claude vision)
- [ ] Multiple concurrent conversations (per user)
- [ ] Guild channel support (opt-in per channel)

### Low Priority
- [ ] Web dashboard for configuration
- [ ] Conversation history browsing
- [ ] Usage statistics/logging
- [ ] Auto-reconnect on disconnect
- [ ] Rate limiting

### Quality of Life
- [ ] Inline code formatting detection
- [ ] Markdown rendering improvements
- [ ] Progress updates for long tasks
- [ ] Command aliases

---

## Changelog

### v1.0.0 (Current)
- Initial release
- DM-only mode for privacy
- Full project management
- Claude Code CLI integration
- Windows batch installers

### Pre-release
- Server channel mode (removed in favor of DM-only)

---

## Known Issues

1. **None currently tracked**

---

## How to Contribute

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## Testing Checklist

- [x] Bot connects to Discord
- [x] Bot responds to DMs only
- [x] `!help` displays commands
- [x] `!add` creates project entry
- [x] `!projects` lists projects
- [x] `!use` switches active project
- [x] Prompts execute Claude Code
- [x] Responses return to Discord
- [x] `!stop` kills running process
- [x] `!clear` starts fresh conversation
- [x] Long messages split correctly
- [x] Graceful shutdown works
