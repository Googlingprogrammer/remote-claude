// ═══════════════════════════════════════════════════════════════
//  Claude Code Discord Hub
//  Control Claude Code on your PC from your phone via Discord.
//
//  How it works:
//    Phone (Discord app) → Discord → PC (this bot) → Claude Code CLI
//    Claude response → PC (this bot) → Discord → Phone
//
//  Commands:
//    !use <project>     - Set active project for this channel
//    !projects          - List all projects
//    !add <name> <path> - Add a project
//    !remove <name>     - Remove a project
//    !clear             - Start a fresh conversation
//    !stop              - Kill running Claude process
//    !status            - Show current state
//    !help              - Show commands
//    (anything else)    - Sent as prompt to Claude Code
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const { Client, GatewayIntentBits, Events, Partials } = require('discord.js');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        const defaults = { projects: {}, channelMap: {}, allowedUsers: [] };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaults, null, 2));
        return defaults;
    }
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function saveConfig(cfg) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

let config = loadConfig();

// ── State ───────────────────────────────────────────────────
const activeProcesses = new Map();  // channelId -> { process, projectName }
const freshStart = new Set();       // channelIds that skip --continue

// ── Discord Client ──────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [
        Partials.Channel, // required to receive DM events
    ],
});

// ── Helpers ─────────────────────────────────────────────────

// Strip ANSI escape codes from Claude's terminal output
function stripAnsi(str) {
    return str.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nq-uy=><~]/g, ''
    );
}

// Only respond to allowed users (empty list = allow all)
function isAllowed(userId) {
    return config.allowedUsers.length === 0 || config.allowedUsers.includes(userId);
}

// Send long text split across multiple Discord messages
async function sendLong(channel, text) {
    if (!text || text.trim().length === 0) {
        await channel.send('*(empty response)*');
        return;
    }

    const MAX = 1950;
    if (text.length <= MAX) {
        await channel.send(text);
        return;
    }

    // Split on natural boundaries (double newline > single newline > hard cut)
    const chunks = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= MAX) {
            chunks.push(remaining);
            break;
        }

        let splitAt = MAX;

        // Prefer paragraph breaks
        let idx = remaining.lastIndexOf('\n\n', MAX);
        if (idx > MAX * 0.3) {
            splitAt = idx + 2;
        } else {
            // Fall back to line breaks
            idx = remaining.lastIndexOf('\n', MAX);
            if (idx > MAX * 0.2) {
                splitAt = idx + 1;
            }
        }

        chunks.push(remaining.slice(0, splitAt));
        remaining = remaining.slice(splitAt);
    }

    for (const chunk of chunks) {
        await channel.send(chunk);
    }
}

// ── Claude Execution ────────────────────────────────────────
async function runClaude(message, projectName, prompt) {
    const channelId = message.channel.id;
    const project = config.projects[projectName];

    if (!project) {
        await message.reply(`Project \`${projectName}\` not found.`);
        return;
    }

    if (activeProcesses.has(channelId)) {
        await message.reply('Claude is still working. Use `!stop` to cancel, or wait.');
        return;
    }

    // Build claude CLI args
    const args = ['-p', prompt, '--output-format', 'text'];
    if (!freshStart.has(channelId)) {
        args.push('-c'); // continue last conversation in this project dir
    }
    freshStart.delete(channelId);

    // Visual feedback
    await message.react('\u23f3'); // hourglass
    const typingInterval = setInterval(() => {
        message.channel.sendTyping().catch(() => {});
    }, 8000);
    message.channel.sendTyping().catch(() => {});

    return new Promise((resolve) => {
        const proc = spawn('claude', args, {
            cwd: project.path,
            shell: true,
            env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
        });

        activeProcesses.set(channelId, { process: proc, projectName });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', async (code) => {
            clearInterval(typingInterval);
            activeProcesses.delete(channelId);

            // Update reaction: hourglass -> checkmark or X
            try {
                await message.reactions.cache.get('\u23f3')?.users.remove(client.user.id);
                await message.react(code === 0 ? '\u2705' : '\u274c');
            } catch (_) {}

            let response = stripAnsi(stdout).trim();
            if (stderr.trim() && !response) {
                const cleanErr = stripAnsi(stderr).trim();
                response = `**Error:**\n\`\`\`\n${cleanErr}\n\`\`\``;
            }

            if (!response) {
                response = code === 0
                    ? '*(completed with no output)*'
                    : `*(exited with code ${code})*`;
            }

            await sendLong(message.channel, response);
            resolve();
        });

        proc.on('error', async (err) => {
            clearInterval(typingInterval);
            activeProcesses.delete(channelId);
            try {
                await message.reactions.cache.get('\u23f3')?.users.remove(client.user.id);
                await message.react('\u274c');
            } catch (_) {}
            await message.reply(`Failed to start Claude: \`${err.message}\``);
            resolve();
        });
    });
}

// ── Commands ────────────────────────────────────────────────
const commands = {

    async help(message) {
        await message.reply(
`**Claude Code Hub**

\`!use <name>\` — Set active project for this channel
\`!projects\` — List all projects
\`!add <name> <path> [desc]\` — Add a project
\`!remove <name>\` — Remove a project
\`!clear\` — Start fresh conversation (next msg only)
\`!stop\` — Kill running Claude process
\`!status\` — Show current state

**Usage:** Set a project with \`!use\`, then just type your prompts.`
        );
    },

    async projects(message) {
        config = loadConfig();
        const names = Object.keys(config.projects);
        if (names.length === 0) {
            await message.reply('No projects yet. Use `!add <name> <path>` to add one.');
            return;
        }

        let text = '**Projects:**\n';
        for (const name of names) {
            const p = config.projects[name];
            const active = config.channelMap[message.channel.id] === name ? '  \u2190 *active*' : '';
            text += `\n**\`${name}\`**${active}\n`;
            if (p.description) text += `> ${p.description}\n`;
            text += `> \`${p.path}\`\n`;
        }
        await message.reply(text);
    },

    async add(message, args) {
        if (args.length < 2) {
            await message.reply(
                'Usage: `!add <name> <path> [description]`\n' +
                'Example: `!add myapp C:\\Work\\myapp My cool app`'
            );
            return;
        }

        const name = args[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const projPath = args[1];
        const desc = args.slice(2).join(' ');

        config.projects[name] = { path: projPath, description: desc };
        saveConfig(config);
        await message.reply(`Added **${name}** \u2192 \`${projPath}\``);
    },

    async remove(message, args) {
        const name = args[0]?.toLowerCase();
        if (!name || !config.projects[name]) {
            await message.reply('Usage: `!remove <name>`');
            return;
        }

        delete config.projects[name];
        for (const [ch, proj] of Object.entries(config.channelMap)) {
            if (proj === name) delete config.channelMap[ch];
        }
        saveConfig(config);
        await message.reply(`Removed **${name}**`);
    },

    async use(message, args) {
        config = loadConfig();
        const name = args[0]?.toLowerCase();

        if (!name) {
            const current = config.channelMap[message.channel.id];
            await message.reply(current
                ? `Active project: **${current}**`
                : 'No active project. Use `!use <name>` to set one.'
            );
            return;
        }

        if (!config.projects[name]) {
            const available = Object.keys(config.projects).map(n => `\`${n}\``).join(', ');
            await message.reply(`Project \`${name}\` not found.\nAvailable: ${available || 'none'}`);
            return;
        }

        config.channelMap[message.channel.id] = name;
        saveConfig(config);
        await message.reply(`Switched to **${name}** \u2192 \`${config.projects[name].path}\``);
    },

    async clear(message) {
        freshStart.add(message.channel.id);
        await message.reply('Next message starts a **fresh** conversation.');
    },

    async stop(message) {
        const active = activeProcesses.get(message.channel.id);
        if (active) {
            active.process.kill();
            activeProcesses.delete(message.channel.id);
            await message.reply(`Stopped Claude (was on **${active.projectName}**).`);
        } else {
            await message.reply('Nothing running right now.');
        }
    },

    async status(message) {
        const project = config.channelMap[message.channel.id];
        const running = activeProcesses.get(message.channel.id);
        await message.reply(
            `**Project:** ${project || 'none set'}\n` +
            `**Claude:** ${running ? `working on **${running.projectName}**` : 'idle'}\n` +
            `**Total projects:** ${Object.keys(config.projects).length}`
        );
    },
};

// ── Message Router ──────────────────────────────────────────
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!isAllowed(message.author.id)) return;

    // Only respond to DMs — ignore server messages
    if (!message.channel.isDMBased()) return;

    const content = message.content.trim();
    if (!content) return;

    // Route commands
    if (content.startsWith('!')) {
        const parts = content.slice(1).split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (commands[cmd]) {
            await commands[cmd](message, args);
        } else {
            await message.reply(`Unknown command \`!${cmd}\`. Try \`!help\`.`);
        }
        return;
    }

    // Route prompts to Claude
    const projectName = config.channelMap[message.channel.id];
    if (!projectName) {
        config = loadConfig();
        const names = Object.keys(config.projects);
        if (names.length === 0) {
            await message.reply('No projects configured yet. Use `!add <name> <path>` first.');
        } else {
            await message.reply(
                `Set a project first with \`!use <name>\`\n` +
                `Available: ${names.map(n => `\`${n}\``).join(', ')}`
            );
        }
        return;
    }

    await runClaude(message, projectName, content);
});

// ── Startup ─────────────────────────────────────────────────
client.on(Events.ClientReady, () => {
    console.log('');
    console.log('  Claude Code Hub - Online (DM mode)');
    console.log(`  Bot: ${client.user.tag}`);
    console.log(`  Projects: ${Object.keys(config.projects).length}`);
    console.log('');
    console.log('  Invite URL (add bot to any server you\'re in, then DM it):');
    console.log(`  https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=0&scope=bot`);
    console.log('');
    console.log('  Listening for DMs...');
    console.log('');
});

// ── Graceful Shutdown ───────────────────────────────────────
function shutdown() {
    console.log('\n  Shutting down...');
    for (const [, active] of activeProcesses) {
        active.process.kill();
    }
    client.destroy();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ── Start ───────────────────────────────────────────────────
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('');
    console.error('  ERROR: Missing DISCORD_TOKEN');
    console.error('  Create a .env file with: DISCORD_TOKEN=your_token_here');
    console.error('');
    process.exit(1);
}

client.login(token);
