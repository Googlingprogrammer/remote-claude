# Remote Claude

Control Claude Code on your PC from your phone via Discord.

```
Phone (Discord app) → Discord → This Bot (PC) → Claude Code CLI
```

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Claude Code CLI | latest | `claude --version` |
| Discord Account | - | - |

## Installation

### Step 1: Clone and Install Dependencies

```bash
git clone https://github.com/Googlingprogrammer/remote-claude.git
cd remote-claude
npm install
```

### Step 2: Create Discord Bot (One-time human setup)

1. Go to https://discord.com/developers/applications
2. Click **New Application** → Name it (e.g., "Claude Hub")
3. Go to **Bot** tab (left sidebar)
4. Click **Reset Token** → Copy the token
5. Enable **MESSAGE CONTENT INTENT** under "Privileged Gateway Intents"

### Step 3: Configure Environment

```bash
# Create .env file
cp .env.example .env
```

Edit `.env` and add your token:
```
DISCORD_TOKEN=your_bot_token_here
```

### Step 4: Start the Bot

```bash
npm start
```

The bot will print an invite URL. Use it to add the bot to any Discord server you're in, then DM the bot directly.

## Configuration

### config.json

```json
{
  "projects": {
    "myapp": {
      "path": "C:\\Work\\myapp",
      "description": "My application"
    }
  },
  "channelMap": {},
  "allowedUsers": []
}
```

| Field | Type | Description |
|-------|------|-------------|
| `projects` | object | Map of project names to paths |
| `projects[name].path` | string | Absolute path to project directory |
| `projects[name].description` | string | Optional description |
| `channelMap` | object | Internal: maps DM channels to active projects |
| `allowedUsers` | array | Discord user IDs allowed to use bot (empty = allow all) |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Discord bot token |

## Commands

All commands use the `!` prefix. Send commands via DM to the bot.

| Command | Arguments | Description |
|---------|-----------|-------------|
| `!add` | `<name> <path> [description]` | Register a project |
| `!remove` | `<name>` | Unregister a project |
| `!projects` | - | List all projects |
| `!use` | `<name>` | Set active project for conversation |
| `!clear` | - | Start fresh conversation (next message only) |
| `!stop` | - | Kill running Claude process |
| `!status` | - | Show current state |
| `!help` | - | Show command list |

Any message not starting with `!` is sent as a prompt to Claude Code.

## Usage Example

```
You:  !add myapp C:\Work\myapp My cool application
Bot:  Added myapp → C:\Work\myapp

You:  !use myapp
Bot:  Switched to myapp → C:\Work\myapp

You:  What files are in this project?
Bot:  ⏳ (processing...)
Bot:  ✅ Here are the files in your project...

You:  !clear
Bot:  Next message starts a fresh conversation.

You:  Explain the main entry point
Bot:  ⏳ (processing...)
Bot:  ✅ The main entry point is...
```

## How It Works

1. Bot receives DM from allowed user
2. If command (`!`), execute command logic
3. If prompt, spawn Claude Code CLI:
   ```bash
   claude -p "<prompt>" --output-format text -c
   ```
4. Capture stdout, strip ANSI codes, send to Discord
5. Split messages >2000 chars at natural boundaries

### Claude CLI Flags Used

| Flag | Purpose |
|------|---------|
| `-p <prompt>` | Pass the prompt |
| `--output-format text` | Plain text output |
| `-c` | Continue previous conversation |

The `-c` flag is omitted after `!clear` to start fresh.

## File Structure

```
remote-claude/
├── bot.js           # Main bot code
├── config.json      # Projects and settings
├── package.json     # Dependencies
├── .env             # Discord token (create from .env.example)
├── .env.example     # Template for .env
├── install.bat      # Windows setup script
├── start.bat        # Windows launcher
├── README.md        # This file
├── PRD.md           # Product requirements
└── PROGRESS.md      # Development progress
```

## Windows Quick Start

```batch
install.bat
:: Follow prompts, then:
start.bat
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Missing DISCORD_TOKEN` | Create `.env` file with your bot token |
| `claude: command not found` | Install Claude Code: `npm install -g @anthropic-ai/claude-code` |
| Bot doesn't respond | Ensure MESSAGE CONTENT INTENT is enabled in Discord Developer Portal |
| Bot responds in server | Bot only responds to DMs, not server channels |
| Long delay | Claude is processing; watch for ⏳ emoji |

## Security Notes

- Bot only responds to direct messages (not server channels)
- Optional user allowlist via `config.json`
- No credentials stored except Discord token
- Claude runs with your local permissions

## Dependencies

```json
{
  "discord.js": "^14.16.3",
  "dotenv": "^16.4.7"
}
```

## License

MIT
