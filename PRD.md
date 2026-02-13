# Product Requirements Document: Remote Claude

## Overview

**Product Name:** Remote Claude (Claude Code Discord Hub)
**Version:** 1.0.0
**Description:** Control Claude Code on your PC from your phone via Discord direct messages.

## Problem Statement

Users want to interact with Claude Code CLI on their PC while away from their computer. Currently, Claude Code requires direct terminal access, limiting productivity when mobile.

## Solution

A Discord bot that bridges your phone to Claude Code running on your PC:

```
Phone (Discord app) → Discord → PC (this bot) → Claude Code CLI
Claude response → PC (this bot) → Discord → Phone
```

## Target Users

- Developers who use Claude Code CLI for coding tasks
- Users who want mobile access to their development environment
- Anyone wanting to run Claude Code prompts remotely

## Core Features

### 1. Project Management
- **Add projects** — Register local project directories with names
- **Remove projects** — Unregister projects
- **List projects** — View all configured projects
- **Switch projects** — Set active project per DM channel

### 2. Claude Code Integration
- **Send prompts** — Any non-command message is sent to Claude Code
- **Continue conversations** — Automatic `-c` flag maintains context
- **Fresh start** — Option to start new conversations
- **Process control** — Kill running Claude processes

### 3. Discord Interface
- **DM-only mode** — Responds only to direct messages for privacy
- **User allowlist** — Optional restriction to specific Discord users
- **Visual feedback** — Hourglass emoji while processing, checkmark/X on completion
- **Long message handling** — Auto-splits responses over 2000 chars

## Commands

| Command | Description |
|---------|-------------|
| `!use <name>` | Set active project for this channel |
| `!projects` | List all configured projects |
| `!add <name> <path> [desc]` | Add a new project |
| `!remove <name>` | Remove a project |
| `!clear` | Start fresh conversation (next message only) |
| `!stop` | Kill running Claude process |
| `!status` | Show current state |
| `!help` | Show available commands |

## Technical Requirements

### Dependencies
- Node.js (v18+)
- discord.js v14.x
- dotenv
- Claude Code CLI installed and in PATH

### Configuration
- `DISCORD_TOKEN` — Discord bot token (in `.env`)
- `config.json` — Stores projects, channel mappings, allowed users

### Security Considerations
- User allowlist support (empty = allow all)
- DM-only mode prevents public channel exposure
- No credentials stored beyond Discord token
- Bot permissions: minimal (read/send messages)

## Non-Functional Requirements

- **Reliability** — Graceful shutdown, process cleanup
- **Usability** — Simple command structure, clear feedback
- **Performance** — Async message handling, typing indicators

## Out of Scope (v1.0)

- Web dashboard
- Multiple simultaneous Claude processes
- File upload/download
- Slash commands (uses prefix commands)
- Guild/server channel support

## Success Metrics

- Bot successfully connects to Discord
- Commands execute without errors
- Claude Code output returns to phone
- Conversation context persists across messages
