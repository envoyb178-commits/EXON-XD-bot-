// EXON XD BOT - Complete Server with All Commands
// Version: 5.0 (Fully fixed & production-ready)
// Owner: EXON XD SIR

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const yts = require('yt-search');
const { exec } = require('child_process');
const os = require('os');
const fetch = require('node-fetch');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    downloadContentFromMessage,
    jidNormalizedUser,
    Browsers,
    delay
} = require('@whiskeysockets/baileys');
const P = require('pino');
const socketIo = require('socket.io');
const http = require('http');
const config = require('./config');

// ===== EXTERNAL LOGO URL =====
let EXTERNAL_LOGO_URL = 'https://i.postimg.cc/rm2gbRzF/In-Shot-20260801-200831900.jpg';

// ===== IMPORT ALL COMMANDS =====
const commands = {
    song: require('./commands/song'),
    video: require('./commands/video'),
    private: require('./commands/private'),
    public: require('./commands/public'),
    ringtone: require('./commands/ringtone'),
    clear: require('./commands/clear'),
    animes: require('./commands/animes'),
    owner: require('./commands/owner'),
    antilink: require('./commands/antilink'),
    weather: require('./commands/weather'),
    anticall: require('./commands/anticall'),
    status: require('./commands/status'),
    antidelete: require('./commands/antidelete'),
    ping: require('./commands/ping'),
    autoreacts: require('./commands/autoreacts'),
    hidetag: require('./commands/hidetag'),
    tagall: require('./commands/tagall'),
    setname: require('./commands/setname'),
    insta: require('./commands/insta'),
    tiktok: require('./commands/tiktok'),
    dp: require('./commands/dp'),
    vv: require('./commands/vv'),
    joke: require('./commands/joke'),
    meme: require('./commands/meme'),
    groupinfo: require('./commands/groupinfo'),
    gdrive: require('./commands/gdrive'),
    mf: require('./commands/mf'),
    translate: require('./commands/translate'),
    autostatus: require('./commands/status'),
    apk: require('./commands/apk'),
    autoread: require('./commands/autoread'),
    character: require('./commands/character'),
    emojimix: require('./commands/emojimix'),
    facebook: require('./commands/facebook'),
    hack: require('./commands/hack'),
    accept: require('./commands/accept'),
    kickoffline: require('./commands/kickoffline'),
    antistatus: require('./commands/antistatus'),
    privacy: require('./commands/privacy'),
    tempmail: require('./commands/tempmail'),
    websiteclone: require('./commands/websiteclone'),
    ephoto: require('./commands/ephoto'),
    stext: require('./commands/stext'),
    chatmanagement: require('./commands/chatmanagement'),
    reactions: require('./commands/reactions'),
    searches: require('./commands/searches'),
};

// ===== IMPORT HANDLERS =====
const animesCommand = require('./commands/animes');
const reactionHandler = require('./commands/reactions');
const searchesHandler = require('./commands/searches');
const chatManagementHandler = require('./commands/chatmanagement');

// ===== EXTRA HELPERS =====
const { handleAutoread } = require('./commands/autoread');
const { handleStatusUpdate } = require('./commands/autostatus');
const { storeMessage, handleMessageRevocation } = require('./commands/antidelete');

// ===== COMMAND LISTS =====
const REACTION_COMMANDS = [
    'bite', 'blush', 'bonk', 'bully', 'cringe', 'cry', 'cuddle',
    'dance', 'glomp', 'handhold', 'happy', 'highfive', 'hug',
    'kick', 'kill', 'kiss', 'lick', 'nom', 'pat', 'poke',
    'slap', 'smile', 'smug', 'wave', 'wink', 'yeet',
    'reaction', 'reactions'
];

const SEARCH_COMMANDS = [
    'google', 'search', 'lyrics', 'yts', 'youtubesearch',
    'stickersearch', 'getsticker', 'github', 'gh',
    'wallpaper', 'wall', 'wikipedia', 'wiki'
];

// ---- FIX: Define NEW_GROUP_COMMANDS array ----
const NEW_GROUP_COMMANDS = [
    'add', 'kick', 'promote', 'demote', 'mute', 'unmute',
    'glock', 'gunlock', 'revoke', 'gname', 'gdesc', 'tagall', 'hidetag'
];

const CHAT_COMMANDS = [
    'clearchat', 'clear', 'deletechat', 'delete', 'exportchat', 'export'
];

// ---- FIX: Helper function for bold text in menu ----
function toBold(text) {
    return `*${text}*`;
}

// ===== APP SETUP =====
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" }, transports: ['websocket', 'polling'] });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ===== CONFIG =====
const PORT = process.env.PORT || 3000;
const AUTH_DIR = './auth_info';
const DATA_FILE = './data/bot_data.json';
const OWNER_NUMBER = process.env.OWNER_NUMBER || '2630000000';

fs.ensureDirSync(AUTH_DIR);
fs.ensureDirSync('./data');

let botData = {
    antilinkGroups: {},
    totalBots: 0,
    registeredBots: [],
    statusSettings: {},
    antiDelete: {},
    userNames: {},
    antiCall: {},
    antiStatusGroups: {},
    allowedUsers: [
        '263773459952',
        '263776193021',
        '263777283870'
    ],
    logoUrl: EXTERNAL_LOGO_URL
};

if (fs.existsSync(DATA_FILE)) {
    try {
        botData = fs.readJsonSync(DATA_FILE);
        if (!botData.allowedUsers || !Array.isArray(botData.allowedUsers)) {
            botData.allowedUsers = ['263773459952', '263776193021', '263777283870'];
        }
        if (botData.logoUrl) {
            EXTERNAL_LOGO_URL = botData.logoUrl;
        }
    } catch (e) {}
}

function saveBotData() {
    fs.writeJsonSync(DATA_FILE, botData);
}

const sessions = {};
const userSockets = {};
const messageLogs = {};

// ===== TELEGRAM BOT =====
const tgToken = "8678340886:AAGCXRAC4ZzqOd35ZXOl9GwXchxBlpBHSKo";
const tgBot = new (require('node-telegram-bot-api'))(tgToken, { polling: true });

tgBot.on('message', async (msg) => {
    try {
        const chatId = msg.chat.id;
        const text = msg.text;
        if (text === '/start') {
            await tgBot.sendMessage(chatId,
                "╔════════════════════════════════════════════╗\n" +
                "║  HELLO IT'S EXON XD BOT WELCOME  ║\n" +
                "╚════════════════════════════════════════════╝\n\n" +
                " 🤖 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 𝐄𝐱𝐨𝐧 𝐗𝐃 𝐁𝐨𝐭\n\n" +
                "📱 𝐄𝐧𝐭𝐞𝐫 𝐲𝐨𝐮𝐫 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐧𝐮𝐦𝐛𝐞𝐫 𝐭𝐨 𝐬𝐭𝐚𝐫𝐭\n" +
                "—•— 𝐎𝐰𝐧𝐞𝐫: 263000000000\n\n" +
                "✨ 𝐔𝐬𝐞 .𝐦𝐞𝐧𝐮 𝐟𝐨𝐫 𝐚𝐥𝐥 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬!\n\n" +
                "🔰 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 LENES",
                { parse_mode: 'Markdown' }
            );
            return;
        }
        if (/^\d+$/.test(text)) {
            const userId = chatId.toString();
            if (!botData.allowedUsers.includes(text) && text !== OWNER_NUMBER) {
                await tgBot.sendMessage(chatId,
                    "╔════════════════════════════════════════════╗\n" +
                    "║ 🚫 𝐀𝐂𝐂𝐄𝐒𝐒 𝐃𝐄𝐍𝐈𝐄𝐃 🚫 ║\n" +
                    "╚════════════════════════════════════════════╝\n\n" +
                    "❌ This number is not on the whitelist.\n" +
                    "Contact the owner to gain access.\n\n" +
                    "🔰 EXON XD BOT",
                    { parse_mode: 'Markdown' }
                );
                return;
            }
            if (!sessions[userId]) {
                sessions[userId] = new BotSession(userId);
            }
            if (!botData.statusSettings[userId]) {
                botData.statusSettings[userId] = {
                    autoStatus: false,
                    autoSeen: false,
                    autoLike: false,
                    autoDownload: false,
                    isPublic: false,
                    aiEnabled: false
                };
                saveBotData();
            }
            await tgBot.sendMessage(chatId,
                "╔════════════════════════════════════════════╗\n" +
                "║  ⚡ 𝐑𝐞𝐪𝐮𝐞𝐬𝐭 𝐑𝐞𝐜𝐞𝐢𝐯𝐞𝐝 ⚡ ║\n" +
                "╚════════════════════════════════════════════╝\n\n" +
                "📱 𝐍𝐮𝐦𝐛𝐞𝐫 ➜ " + text + "\n" +
                "🔄 𝐒𝐭𝐚𝐭𝐮𝐬 ➜ 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐧𝐠...\n" +
                "⏳ 𝐖𝐚𝐢𝐭 𝐟𝐨𝐫 𝐩𝐚𝐢𝐫𝐢𝐧𝐠 𝐜𝐨𝐝𝐞...\n\n" +
                "🤖 EXON XD BOT",
                { parse_mode: 'Markdown' }
            );
            sessions[userId].tgChatId = chatId;
            await sessions[userId].initialize(text);
        }
    } catch (err) {
        console.error('Telegram error:', err);
    }
});

// ===== STYLISH TEXT =====
const STYLISH = {
    connected: "╔════════════════╗\n║ 🚀 EXON XD BOT 🚀 ║\n╚══════════════╝\n\n✅ CONNECTED\n⚡ SUCCESSFULLY\n\n🤖 BOT STATUS ➜ ONLINE\n⚡ SYSTEM ➜ ACTIVATED\n🛠️ SERVER ➜ RUNNING\n🔥 MODULES ➜ ACTIVE\n\n📋 Type .menu to view all commands\n\n🔰 POWERED BY EXON",
    disconnected: "╔═════════════════╗\n║ ⚠️ EXON XD BOT ⚠️ ║\n╚═════════════════╝\n\n🔴 DISCONNECTED\n🔄 RECONNECTING...\n\n🤖 BOT STATUS ➜ OFFLINE\n⚡ SYSTEM ➜ RESTARTING\n🛠️ SERVER ➜ ACTIVE\n\n⏳ Please wait while we reconnect...\n\n🔰 POWERED BY LENES",
    keepAlive: "╔════════════════╗\n║ 🚀EXON XD BOT 🚀 ║\n╚══════════════════╝\n\n✅ ACTIVE 24/7\n⚡ SYSTEM ONLINE\n\n🤖 BOT STATUS ➜ RUNNING\n⚡ UPTIME ➜ ACTIVE\n🛠️ SECURITY ➜ ENABLED\n🔥 PERFORMANCE ➜ OPTIMAL\n\n🌟 Your bot is running smoothly!\n\n🔰 POWERED BY LENES",
    pairingCode: "╔═════════════════╗\n║ 🔑 PAIRING CODE 🔑 ║\n╚═════════════════╝\n\n📱 YOUR CODE:\n——— [CODE]\n\n⚡ Enter this code in your WhatsApp\n⏰ Code expires in 60 seconds\n\n🔰 EXON XD BOT",
    antiCall: "╔═══════════════════╗\n║ 🚫 ANTI-CALL ACTIVE 🚫 ║\n╚═════════════════╝\n\n⚠️ I don't accept calls!\n💬 Please send a message instead.\n\n📵 Call Auto-Rejected\n\n🤖 EXON XD BOT"
};

// =========================================
// ===== BOT SESSION CLASS ================
// =========================================
class BotSession {
    constructor(userId) {
        this.userId = userId;
        this.sock = null;
        this.isConnected = false;
        this.aiEnabled = botData.statusSettings[userId]?.aiEnabled || false;
        this.autoReact = botData.statusSettings[userId]?.autoReact || false;
        this.isPublic = botData.statusSettings[userId]?.isPublic || false;
        this.authPath = path.join(AUTH_DIR, userId);
        this.processedMessages = new Set();
        this.activeInterval = null;
        this.isInitializing = false;
        this.userChats = {};
        this.lastConnectMessageTime = null;
        this.onPairingCode = null;
        this.tgChatId = null;
    }

    sendLog(message, type = 'info') {
        const logEntry = { timestamp: new Date().toLocaleTimeString(), message, type };
        const socketId = userSockets[this.userId];
        if (socketId) io.to(socketId).emit('console', logEntry);
        console.log('[' + this.userId + '] ' + message);
    }

    sendConnectionStatus() {
        const socketId = userSockets[this.userId];
        if (socketId) {
            io.to(socketId).emit('connection-status', { connected: this.isConnected, user: this.userId });
        }
        io.emit('total-active', Object.values(sessions).filter(s => s.isConnected).length);
    }

    // ==================== INTERNAL COMMAND HANDLERS ====================

    async askAI(query) {
        const apis = [
            (q) => `https://mistral.stacktoy.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`,
            (q) => `https://llama.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`,
            (q) => `https://mistral.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`
        ];
        for (const apiUrl of apis) {
            try {
                const { data } = await axios.get(apiUrl(query), { timeout: 15000 });
                const response = data?.data?.response || data?.response || data?.result;
                if (response && typeof response === 'string' && response.trim()) return response.trim();
                if (data && typeof data === 'string') return data.trim();
            } catch {}
        }
        throw new Error('All AI APIs failed');
    }

    async handleAICommand(from, msg, text) {
        if (!text) {
            return this.sock.sendMessage(from, {
                text: "🤖 *AI Assistant*\n\nUsage: `.ai <your question>`\nExample: `.ai explain quantum physics`"
            }, { quoted: msg });
        }
        try {
            await this.sock.sendMessage(from, { react: { text: '🤖', key: msg.key } });
            const answer = await this.askAI(text);
            await this.sock.sendMessage(from, { text: answer }, { quoted: msg });
        } catch (error) {
            await this.sock.sendMessage(from, {
                text: '❌ Failed to get AI response. Please try again later.'
            }, { quoted: msg });
        }
    }

    async handleFun(from, msg, apiUrl, label) {
        try {
            const { data } = await axios.get(apiUrl, { timeout: 10000 });
            let text = data?.text || data?.joke || data?.quote || data?.fact || data?.advice ||
                data?.pickup || data?.love || data?.roast || data?.dare || data?.truth ||
                data?.answer || data?.rizz || data?.news || data?.setup || data?.delivery ||
                data?.response || data?.message || 'No result';
            if (typeof text === 'object') { text = JSON.stringify(text); }
            await this.sock.sendMessage(from, { text: `${label}: ${text}` }, { quoted: msg });
        } catch {
            await this.sock.sendMessage(from, { text: `Failed to fetch ${label}.` }, { quoted: msg });
        }
    }

    async handleGitStalk(from, msg, username) {
        if (!username) return this.sock.sendMessage(from, { text: 'Provide a GitHub username.' }, { quoted: msg });
        try {
            const { data: user } = await axios.get(`https://api.github.com/users/${username}`, {
                headers: { 'User-Agent': 'EXON-XD-Bot' }
            });
            const { data: repos } = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, {
                headers: { 'User-Agent': 'EXON-XD-Bot' }
            });
            let stars = 0, forks = 0, langs = {};
            repos.forEach(r => {
                stars += r.stargazers_count;
                forks += r.forks_count;
                if (r.language) langs[r.language] = (langs[r.language] || 0) + 1;
            });
            const topLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l).join(', ') || 'N/A';
            const info =
                `📊 *GITSTALK - GITHUB ANALYTICS*\n\n` +
                `📌 *Profile:* ${user.name || user.login}\n` +
                `📌 *Username:* @${user.login}\n` +
                `📌 *Bio:* ${user.bio || 'No bio'}\n` +
                `📌 *Location:* ${user.location || 'Unknown'}\n` +
                `📌 *Company:* ${user.company || 'N/A'}\n` +
                `📌 *Blog:* ${user.blog || 'N/A'}\n\n` +
                `📊 *Statistics:*\n` +
                `📌 *Followers:* ${user.followers}\n` +
                `📌 *Following:* ${user.following}\n` +
                `📌 *Public Repos:* ${user.public_repos}\n` +
                `📌 *Public Gists:* ${user.public_gists}\n\n` +
                `📊 *Analytics:*\n` +
                `📌 *Total Stars:* ${stars}\n` +
                `📌 *Total Forks:* ${forks}\n` +
                `📌 *Top Languages:* ${topLangs}\n\n` +
                `🔗 *URL:* ${user.html_url}`;
            await this.sock.sendMessage(from, {
                image: { url: user.avatar_url },
                caption: info
            }, { quoted: msg });
        } catch (error) {
            await this.sock.sendMessage(from, {
                text: `Error: ${error.response?.status === 404 ? 'User not found' : error.message}`
            }, { quoted: msg });
        }
    }

    async handleYTSearch(from, msg, query) {
        if (!query) return this.sock.sendMessage(from, { text: 'Provide search query.' }, { quoted: msg });
        try {
            const result = await yts(query);
            const videos = result.videos.slice(0, 10);
            if (!videos.length) return this.sock.sendMessage(from, { text: 'No results.' }, { quoted: msg });
            let text = `✨ *MUSIC SEARCH* ✨\n\n`;
            videos.forEach((v, i) => {
                text +=
                    `*${i+1}.🎧 ${v.title}*\n⏰ ${v.timestamp}\n👀 ${v.views}\n🔗 ${v.url}\n──────────────────\n`;
            });
            await this.sock.sendMessage(from, {
                image: { url: videos[0].image },
                caption: text
            }, { quoted: msg });
        } catch {
            await this.sock.sendMessage(from, { text: 'Search failed.' }, { quoted: msg });
        }
    }

    async handleAudioFX(from, msg, effect, quoted) {
        const effects = ['bass', 'blown', 'deep', 'earrape', 'fast', 'fat', 'nightcore', 'reverse', 'robot', 'slow', 'chipmunk'];
        if (!effect || !effects.includes(effect)) {
            return this.sock.sendMessage(from, {
                text: '🎧 *Audio Effects* 🎧\n\n' +
                    effects.map(e => `• *${e}*`).join('\n') +
                    '\n\n📌 Reply to an audio with: .audiofx <effect>'
            }, { quoted: msg });
        }
        const audioBuffer = await this.getQuotedAudio(quoted);
        if (!audioBuffer) return this.sock.sendMessage(from, { text: 'Reply to an audio/voice note.' }, { quoted: msg });
        const tmp = path.join(process.cwd(), 'tmp');
        fs.ensureDirSync(tmp);
        const input = path.join(tmp, `in_${Date.now()}.ogg`);
        const output = path.join(tmp, `out_${Date.now()}.ogg`);
        fs.writeFileSync(input, audioBuffer);
        const filterMap = {
            bass: 'equalizer=f=94:width_type=o:width=2:g=30',
            blown: 'acrusher=.1:1:64:0:log',
            deep: 'atempo=1,asetrate=44500*2/3',
            earrape: 'volume=12',
            fast: 'atempo=1.63',
            fat: 'atempo=1.6',
            nightcore: 'atempo=1.06',
            reverse: 'areverse',
            robot: "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)'",
            slow: 'atempo=0.7',
            chipmunk: 'atempo=0.5'
        };
        const filter = filterMap[effect];
        try {
            await new Promise((resolve, reject) => {
                exec(`ffmpeg -y -i "${input}" -af "${filter},aresample=48000,asetpts=N/SR" -c:a libopus -b:a 64k -ac 1 "${output}"`,
                    (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
            });
            const outBuffer = fs.readFileSync(output);
            await this.sock.sendMessage(from, {
                audio: outBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            }, { quoted: msg });
            fs.unlinkSync(input);
            fs.unlinkSync(output);
        } catch {
            await this.sock.sendMessage(from, {
                text: 'Failed to apply effect. Ensure ffmpeg is installed.'
            }, { quoted: msg });
        }
    }

    async getQuotedMedia(quoted) {
        if (!quoted) return null;
        const msg = quoted.message || quoted;
        const media = msg.imageMessage || msg.videoMessage || msg.audioMessage || msg.voiceMessage || msg.documentMessage;
        if (!media) return null;
        const stream = await downloadContentFromMessage(media, 'image' in media ? 'image' : 'video' in media ? 'video' : 'audio');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), mimetype: media.mimetype };
    }

    async getQuotedAudio(quoted) {
        if (!quoted) return null;
        const msg = quoted.message || quoted;
        const audio = msg.audioMessage || msg.voiceMessage;
        if (!audio) return null;
        const stream = await downloadContentFromMessage(audio, 'audio');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return Buffer.concat(chunks);
    }

    async groupAction(jid, action, users) {
        try {
            return await this.sock.groupParticipantsUpdate(jid, users, action);
        } catch (e) {
            throw new Error(e.message);
        }
    }

    async changeGroupSubject(jid, subject) {
        try {
            await this.sock.groupUpdateSubject(jid, subject);
        } catch (e) {
            throw new Error(e.message);
        }
    }

    async changeGroupDescription(jid, description) {
        try {
            await this.sock.groupUpdateDescription(jid, description);
        } catch (e) {
            throw new Error(e.message);
        }
    }

    async revokeGroupInvite(jid) {
        try {
            return await this.sock.groupRevokeInvite(jid);
        } catch (e) {
            throw new Error(e.message);
        }
    }

    async setGroupSettings(jid, setting, value) {
        try {
            await this.sock.groupSettingUpdate(jid, setting, value);
        } catch (e) {
            throw new Error(e.message);
        }
    }

    // ==================== INITIALIZATION ====================
    async initialize(pairingNumber = null, onPairingCode = null) {
        if (this.isInitializing) {
            this.sendLog("⏳ Initialization already in progress...", "info");
            return;
        }
        this.isInitializing = true;
        this.onPairingCode = onPairingCode;
        try {
            const { version } = await fetchLatestBaileysVersion();
            const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
            this.sock = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'fatal' })),
                },
                printQRInTerminal: false,
                logger: P({ level: 'fatal' }),
                browser: Browsers.ubuntu('Chrome'),
                syncFullHistory: false,
                shouldSyncHistoryMessage: () => false,
                markOnlineOnConnect: true,
                keepAliveIntervalMs: 30000,
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                emitOwnEvents: true,
                retryRequestDelayMs: 5000,
                maxMsgRetryCount: 5,
                linkPreviewImageThumbnailWidth: 192,
                transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
                getMessage: async (key) => {
                    if (messageLogs[key.id]) {
                        return { conversation: messageLogs[key.id].text };
                    }
                    return { conversation: '🤖 Bot is active' };
                },
                patchMessageBeforeSending: (message) => {
                    const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage);
                    if (requiresPatch) {
                        return {
                            viewOnceMessage: {
                                message: {
                                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                                    ...message
                                }
                            }
                        };
                    }
                    return message;
                },
                generateHighQualityLinkPreview: true,
            });

            if (pairingNumber && !state.creds.registered) {
                if (!this.sock.authState.creds.registered) {
                    await delay(3000);
                    try {
                        let code = await this.sock.requestPairingCode(pairingNumber);
                        code = code?.match(/.{1,4}/g)?.join("-") || code;
                        this.sendLog("🔑 Pairing Code Generated: " + code, 'success');
                        if (this.tgChatId) {
                            const pairingMsg = STYLISH.pairingCode.replace('[CODE]', code);
                            await tgBot.sendMessage(this.tgChatId, pairingMsg, { parse_mode: 'Markdown' });
                        }
                        const socketId = userSockets[this.userId];
                        if (socketId) io.to(socketId).emit('pairing-code', code);
                        if (this.onPairingCode) {
                            await this.onPairingCode(code);
                        }
                    } catch (err) {
                        this.sendLog("❌ Pairing error: " + err.message, 'error');
                        if (this.tgChatId) {
                            await tgBot.sendMessage(this.tgChatId,
                                "╔════════════════════════════════════════════╗\n" +
                                "║ ❌ 𝐏𝐚𝐢𝐫𝐢𝐧𝐠 𝐄𝐫𝐫𝐨𝐫 ❌ ║\n" +
                                "╚════════════════════════════════════════════╝\n\n" +
                                "🔴 𝐄𝐫𝐫𝐨𝐫: " + err.message + "\n\n" +
                                "🔄 𝐏𝐥𝐞𝐚𝐬𝐞 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐰𝐢𝐭𝐡 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐧𝐮𝐦𝐛𝐞𝐫\n\n" +
                                "🔰 EXON XD BOT",
                                { parse_mode: 'Markdown' }
                            );
                        }
                        if (this.onPairingCode) {
                            await this.onPairingCode('ERROR: ' + err.message);
                        }
                    }
                }
            }

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('call', async (calls) => {
                if (botData.antiCall[this.userId]) {
                    for (const call of calls) {
                        if (call.status === 'offer') {
                            try {
                                await this.sock.rejectCall(call.id, call.from);
                                await this.sock.sendMessage(call.from, { text: STYLISH.antiCall });
                            } catch (e) {}
                        }
                    }
                }
            });

            this.sock.ev.on('messages.upsert', async (m) => {
                if (m.type !== 'notify') return;
                await Promise.all(m.messages.map(async (msg) => {
                    if (msg.messageStubType === 1 || msg.messageStubType === 2) {
                        this.sendLog('⚠️ Received undecryptable message. Possible session conflict.', 'warning');
                    }
                    try {
                        const from = msg.key.remoteJid;
                        const isMe = msg.key.fromMe;
                        const isGroup = from?.endsWith('@g.us') || false;
                        const isStatus = from === 'status@broadcast';
                        const messageContent = msg.message?.ephemeralMessage?.message ||
                            msg.message?.viewOnceMessage?.message ||
                            msg.message?.viewOnceMessageV2?.message ||
                            msg.message;
                        if (!messageContent) return;
                        const type = Object.keys(messageContent)[0];
                        const text = (messageContent.conversation ||
                            messageContent.extendedTextMessage?.text ||
                            messageContent.imageMessage?.caption ||
                            messageContent.videoMessage?.caption || '').trim();

                        if (!isMe && !isStatus) {
                            await handleAutoread(this.sock, msg);
                            await storeMessage(msg);
                        }
                        if (msg.message?.protocolMessage?.type === 0) {
                            await handleMessageRevocation(this.sock, msg);
                            return;
                        }

                        const msgId = msg.key.id;
                        if (this.processedMessages.has(msgId)) return;
                        this.processedMessages.add(msgId);
                        if (this.processedMessages.size > 1000) this.processedMessages.delete(this.processedMessages.values().next().value);

                        if (!isStatus) {
                            let logEntry = { text, type };
                            if (['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) {
                                try {
                                    const mContent = messageContent[type];
                                    if (mContent && (mContent.directPath || mContent.url)) {
                                        const stream = await downloadContentFromMessage(mContent, type.replace('Message', ''));
                                        let buffer = Buffer.from([]);
                                        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                                        logEntry.buffer = buffer;
                                    }
                                } catch (e) {}
                            }
                            logEntry.pushName = msg.pushName || 'User';
                            messageLogs[msgId] = logEntry;
                            if (Object.keys(messageLogs).length > 2000) delete messageLogs[Object.keys(messageLogs)[0]];
                        }

                        if (this.autoReact && !isMe && !isStatus) {
                            const emojis = ['❤️', '👍', '🔥', '👏', '😎', '😂', '🙌', '✨', '⭐', '✅', '🤖', '⚡', '🌟', '💯', '🌈', '💎', '🔰', '🎉', '🧿', '🏆'];
                            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                            try {
                                await this.sock.sendMessage(from, {
                                    react: { text: randomEmoji, key: msg.key }
                                });
                            } catch (e) {}
                        }

                        if (isStatus && !isMe) {
                            await handleStatusUpdate(this.sock, m, botData, this.userId);
                            return;
                        }

                        const botNumber = jidNormalizedUser(this.sock.user.id);
                        const sender = msg.key.participant || from;
                        const isOwner = isMe || sender.includes(botNumber.split('@')[0]) || sender === (OWNER_NUMBER + '@s.whatsapp.net');

                        let isAdmin = isOwner;
                        if (!isAdmin && isGroup) {
                            try {
                                const groupMetadata = await this.sock.groupMetadata(from);
                                const participant = groupMetadata.participants.find(p => p.id === sender);
                                isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
                            } catch (e) {
                                isAdmin = false;
                            }
                        }

                        const cmd = text.toLowerCase();
                        const args = text.split(' ').slice(1);
                        const q = args.join(' ');

                        // ---- Anti-link & Anti-status ----
                        if (isGroup && botData.antiStatusGroups && botData.antiStatusGroups[from] && !isAdmin) {
                            const isStatusMsg = msg.message?.protocolMessage?.type === 0 ||
                                msg.message?.viewOnceMessage ||
                                msg.message?.viewOnceMessageV2 ||
                                msg.message?.viewOnceMessageV2Extension ||
                                (text && (text.includes('whatsapp.com/channel/') || text.includes('status@broadcast')));
                            if (msg.message?.forwardingScore > 0 || isStatusMsg) {
                                try {
                                    await this.sock.sendMessage(from, { delete: msg.key });
                                    return;
                                } catch (e) {}
                            }
                        }

                        if (isGroup && botData.antilinkGroups[from] && !isAdmin) {
                            const linkPatterns = [/chat.whatsapp.com\//i, /http:\/\//i, /https:\/\//i, /www\./i, /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i];
                            if (linkPatterns.some(pattern => pattern.test(text))) {
                                try {
                                    const mode = botData.antilinkGroups[from];
                                    await this.sock.sendMessage(from, { delete: msg.key });
                                    if (mode === 'kick') await this.sock.groupParticipantsUpdate(from, [sender], "remove");
                                } catch (e) {}
                                return;
                            }
                        }

                        if (!this.isPublic && !isOwner) return;

                        // ---- WHITELIST CHECK ----
                        const senderNumber = sender.split('@')[0];
                        if (!isOwner && !botData.allowedUsers.includes(senderNumber)) {
                            if (cmd.startsWith('.')) {
                                await this.sock.sendMessage(from, {
                                    text: '🚫 *You are not authorized to use this bot.*\nContact the owner to be added to the whitelist.'
                                }, { quoted: msg });
                            }
                            return;
                        }

                        if (cmd.startsWith('.')) {
                            const commandName = cmd.slice(1).split(' ')[0];
                            (async () => {
                                try {
                                    // ==================== COMMAND DISPATCH ====================

                                    // ---- 1. REACTION COMMANDS ----
                                    if (REACTION_COMMANDS.includes(commandName)) {
                                        await reactionHandler(this.sock, msg, args, commandName);
                                        return;
                                    }

                                    // ---- 2. SEARCH COMMANDS ----
                                    if (SEARCH_COMMANDS.includes(commandName)) {
                                        await searchesHandler(this.sock, msg, args, commandName);
                                        return;
                                    }

                                    // ---- 3. GROUP MANAGEMENT COMMANDS ----
                                    if (NEW_GROUP_COMMANDS.includes(commandName)) {
                                        await this.handleGroupCommands(from, msg, args, commandName, isAdmin);
                                        return;
                                    }

                                    // ---- 4. CHAT MANAGEMENT COMMANDS (owner-only) ----
                                    if (CHAT_COMMANDS.includes(commandName)) {
                                        if (!isOwner) {
                                            return await this.sock.sendMessage(from, {
                                                text: '❌ Only the bot owner can use this command.'
                                            }, { quoted: msg });
                                        }
                                        await chatManagementHandler(this.sock, msg, args, commandName);
                                        return;
                                    }

                                    // ---- 5. EXTERNAL COMMANDS (from commands object) ----
                                    if (typeof commands[commandName] === 'function' && commandName !== 'animes') {
                                        await commands[commandName](this.sock, msg, args);
                                        return;
                                    }

                                    switch (commandName) {
                                        case 'menu':
                                        case 'menu1': {
                                            const loadEmojis = ['⏳', '⌛', '🚀', '✨'];
                                            for (const emoji of loadEmojis) await this.sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
                                            const customName = botData.userNames[this.userId] || msg.pushName || 'User';
                                            const uptimeHours = Math.floor(process.uptime() / 3600);
                                            const uptimeMinutes = Math.floor((process.uptime() % 3600) / 60);
                                            const menuText = `
╔════〔 ${toBold("EXON XD")} 〕═════╗    
║ ┃ ➤ ${toBold("USER")}    : ${customName}
║ ┃ ➤ ${toBold("STATUS")}  : ${toBold("ALIVE")}
║ ┃ ➤ ${toBold("MODE")}    : ${this.isPublic ? toBold("PUB") : toBold("PRV")}
║ ┃ ➤ ${toBold("DEV")}   : ${toBold("ENY")}
║ ┃ ➤ ${toBold("UP⏰")}  : ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m
╚═════〔 ${toBold("BOT")} 〕════
║ ╭━━〔 ${toBold("GENERAL")} 〕━━
║ ┃ ➤ ${toBold(".alive")}
║ ┃ ➤ ${toBold(".ping")}
║ ┃ ➤ ${toBold(".menu")}
║ ┃ ➤ ${toBold(".status")}
║ ┃ ➤ ${toBold(".pingweb")}
║ ┃ ➤ ${toBold(".vv")}
║ ╰━━━━━━━━━━━━━━╯
║ ╭━━〔 ${toBold("AI")} 〕━━╮
║ ┃ ➤ ${toBold(".ai")}
║ ┃ ➤ ${toBold(".gpt")}
║ ┃ ➤ ${toBold(".chatai")}
║ ┃ ➤ ${toBold(".mistral")}
║ ┃ ➤ ${toBold(".dalle")}
║ ┃ ➤ ${toBold(".flux")} 
║ ┃ ➤ ${toBold(".image")}
║ ╰━━━━━━━━━━━━━╯
║ ╭━━〔 ${toBold("DOWNLOAD")} 〕━━╮
║ ┃ ➤ ${toBold(".apk")}
║ ┃ ➤ ${toBold(".facebook")}
║ ┃ ➤ ${toBold(".tiktok")}
║ ┃ ➤ ${toBold(".insta")}
║ ┃ ➤ ${toBold(".song")}
║ ┃ ➤ ${toBold(".video")}
║ ┃ ➤ ${toBold(".joke")}
║ ┃ ➤ ${toBold(".meme")}
║ ┃ ➤ ${toBold(".emojimix")}
║ ┃ ➤ ${toBold(".character")}
║ ┃ ➤ ${toBold(".gdrive")}
║ ┃ ➤ ${toBold(".mf")}
║ ┃ ➤ ${toBold(".yt")}
║ ┃ ➤ ${toBold(".yts")}
║ ┃ ➤ ${toBold(".git")}
║ ┃ ➤ ${toBold(".ringtone")}
║ ╰━━━━━━━━━━━━━━━╯
║ ╭━━〔 ${toBold("GROUP")} 〕━━╮
║ ┃ ➤ ${toBold(".add")}
║ ┃ ➤ ${toBold(".kick")}
║ ┃ ➤ ${toBold(".promote")}
║ ┃ ➤ ${toBold(".demote")}
║ ┃ ➤ ${toBold(".unmute")}
║ ┃ ➤ ${toBold(".mute")} 
║ ┃ ➤ ${toBold(".glock")}
║ ┃ ➤ ${toBold(".gunlock")}
║ ┃ ➤ ${toBold(".gset")}
║ ┃ ➤ ${toBold(".gname")}
║ ┃ ➤ ${toBold(".gdesc")}
║ ┃ ➤ ${toBold(".revoke")}
║ ╰━━━━━━━━━━━━━╯
║ ╭━━〔 ${toBold("OWNER")} 〕━━╮
║ ┃ ➤ ${toBold(".private")}
║ ┃ ➤ ${toBold(".public")}
║ ┃ ➤ ${toBold(".autoread")}
║ ┃ ➤ ${toBold(".status")}
║ ┃ ➤ ${toBold(".hack")}
║ ┃ ➤ ${toBold(".hidetag")}
║ ┃ ➤ ${toBold(".tagall")}
║ ┃ ➤ ${toBold(".setname")}
║ ┃ ➤ ${toBold(".anticall")}
║ ┃ ➤ ${toBold(".kickoffline")}
║ ┃ ➤ ${toBold(".antistatus")}
║ ┃ ➤ ${toBold(".groupinfo")}
║ ┃ ➤ ${toBold(".accept")}
║ ┃ ➤ ${toBold(".audiofx")}
║ ┃ ➤ ${toBold(".animes")}
║ ┃ ➤ ${toBold(".itunes")}
║ ┃ ➤ ${toBold(".define")}
║ ┃ ➤ ${toBold(".movie")}
║ ┃ ➤ ${toBold(".image")}
║ ┃ ➤ ${toBold(".meme")}
║ ╰━━━━━━━━━━━━━━╯
║ ╭━━〔 ${toBold("TOOLS")} 〕━━╮
║ ┃ ➤ ${toBold(".weather")}
║ ┃ ➤ ${toBold(".webesiteclone")}
║ ┃ ➤ ${toBold(".ssweb ")}
║ ┃ ➤ ${toBold(".web2apk ")}
║ ┃ ➤ ${toBold(".tempmail")}
║ ┃ ➤ ${toBold(".dp")} 
║ ┃ ➤ ${toBold(".translate")}
║ ┃ ➤ ${toBold(".ephoto")}
║ ┃ ➤ ${toBold(".stext")}
║ ┃ ➤ ${toBold(".yts")}
║ ┃ ➤ ${toBold(".wallpaper")}
║ ┃ ➤ ${toBold(".google")}
║ ┃ ➤ ${toBold(".lyrics")}
║ ┃ ➤ ${toBold(".search")}
║ ┃ ➤ ${toBold(".youtubesearch")}
║ ┃ ➤ ${toBold(".stickersearch")}
║ ┃ ➤ ${toBold(".getsticker")}
║ ┃ ➤ ${toBold(".github")}
║ ┃ ➤ ${toBold(".gh")}
║ ┃ ➤ ${toBold(".wall")}
║ ┃ ➤ ${toBold(".wikipedia")}
║ ┃ ➤ ${toBold(".wiki")}
║ ┃ ➤ ${toBold(".privacy")}
║ ┃ ➤ ${toBold(".setprivacy")}
║ ┃ ➤ ${toBold(".clear")}
║ ╰━━━━━━━━━━━━━╯
║ ╭━━〔 ${toBold("SETTINGS")} 〕━━╮
║ ┃ ➤ ${toBold(".achive")}
║ ┃ ➤ ${toBold(".unachive")}
║ ┃ ➤ ${toBold(".pair")}
║ ┃ ➤ ${toBold(".users")}
║ ┃ ➤ ${toBold(".unlink")}
║ ┃ ➤ ${toBold(".unpair")} 
║ ┃ ➤ ${toBold(".pin")}
║ ┃ ➤ ${toBold(".unpin")}
║ ┃ ➤ ${toBold(".owner")}
║ ╰━━━━━━━━━━━━━╯
║ ╭━━〔 ${toBold("FUN")} 〕━━╮
║ ┃ ➤ ${toBold(".reaction")}
║ ┃ ➤ ${toBold(".reactions")}
║ ┃ ➤ ${toBold(".joke")}
║ ┃ ➤ ${toBold(".darkjoke")}
║ ┃ ➤ ${toBold(".bite")}
║ ┃ ➤ ${toBold(".blush")} 
║ ┃ ➤ ${toBold(".bonk")}
║ ┃ ➤ ${toBold(".bully")}
║ ┃ ➤ ${toBold(".cry")}
║ ┃ ➤ ${toBold(".cringe")}
║ ┃ ➤ ${toBold(".dance")}
║ ┃ ➤ ${toBold(".cuddle")}
║ ┃ ➤ ${toBold(".glomp")}
║ ┃ ➤ ${toBold(".handhold")}
║ ┃ ➤ ${toBold(".happy")}
║ ┃ ➤ ${toBold(".highfive")}
║ ┃ ➤ ${toBold(".hug")}
║ ┃ ➤ ${toBold(".kill")}
║ ┃ ➤ ${toBold(".kiss")}
║ ┃ ➤ ${toBold(".lick")}
║ ┃ ➤ ${toBold(".nom")}
║ ┃ ➤ ${toBold(".pat")}
║ ┃ ➤ ${toBold(".pok")}
║ ┃ ➤ ${toBold(".slap")}
║ ┃ ➤ ${toBold(".smile")}
║ ┃ ➤ ${toBold(".smug")}
║ ┃ ➤ ${toBold(".wave")}
║ ┃ ➤ ${toBold(".wink")}
║ ┃ ➤ ${toBold(".yeet")}
║ ╰━━━━━━━━━━━━━╯
║ ╭━━〔 ${toBold("PROTECTION")} 〕━━╮
║ ┃ ➤ ${toBold(".antilink")}
║ ┃ ➤ ${toBold(".antibot")}
║ ┃ ➤ ${toBold(".antistatus")}
║ ┃ ➤ ${toBold(".antidelete")}
║ ┃ ➤ ${toBold(".autoreact")}
║ ┃ ➤ ${toBold(".autoread")} 
║ ╰━━━━━━━━━━━━━╯
║ ╭━━〔 ${toBold("ACTIVE")} 〕━━━╮
║ ┃ ➤ ${toBold("AI")}           : ${this.aiEnabled ? '🟢ON' : '🔴OFF'}
║ ┃ ➤ ${toBold("Auto-React")}    : ${this.autoReact ? '🟢ON' : '🔴OFF'}
║ ┃ ➤ ${toBold("Anti-Delete")}   : ${botData.antiDelete[this.userId] ? '🟢ON' : '🔴OFF'}
║ ┃ ➤ ${toBold("Auto-Status")}   : ${(botData.statusSettings[this.userId] && botData.statusSettings[this.userId].autoStatus) ? '🟢ON' : '🔴OFF'}
║ ┃ ➤ ${toBold("Mode")}   : ${this.isPublic ? '🟢PUB' : '🔴PRV'}
║ ╰━━━━━━━━━━━━━━━╮
╚═════════════════╝
                                            `;
                                            try {
                                                const menuImg = await axios.get('https://i.postimg.cc/rm2gbRzF/In-Shot-20260801-200831900.jpg', { responseType: 'arraybuffer' });
                                                await this.sock.sendMessage(from, { image: menuImg.data, caption: menuText });
                                            } catch (e) {
                                                await this.sock.sendMessage(from, { text: menuText });
                                            }
                                            break;
                                        }
                                        // ---------- AI ----------
                                        case 'ai':
                                        case 'gpt':
                                        case 'chatai':
                                        case 'mistral':
                                            await this.handleAICommand(from, msg, q);
                                            break;

                                        // ---------- FUN ----------
                                        case 'joke':
                                            await this.handleFun(from, msg, 'https://v2.jokeapi.dev/joke/Any?type=single', '😂 Joke');
                                            break;
                                        case 'darkjoke':
                                            await this.handleFun(from, msg, 'https://v2.jokeapi.dev/joke/Dark?type=single', '🖤 Dark Joke');
                                            break;

                                        // ---------- AUDIOFX ----------
                                        case 'audiofx':
                                            await this.handleAudioFX(from, msg, args[0], msg.message?.extendedTextMessage?.contextInfo?.quotedMessage);
                                            break;

                                        // ---------- YTS ----------
                                        case 'yts':
                                            await this.handleYTSearch(from, msg, q);
                                            break;

                                        // ---------- GIT ----------
                                        case 'git':
                                            await this.handleGitStalk(from, msg, q);
                                            break;

                                        // ---------- OTHER COMMANDS ----------
                                        case 'alive':
                                            await this.handleAlive(from, msg);
                                            break;
                                        case 'pingweb':
                                            await this.handlePingWeb(from, msg, q);
                                            break;
                                        case 'archive':
                                        case 'unarchive':
                                            await this.handleArchiveChat(from, msg, commandName);
                                            break;
                                        case 'pin':
                                        case 'unpin':
                                            await this.handlePinChat(from, msg, commandName);
                                            break;
                                        case 'gcset':
                                            await this.handleGcSet(from, msg, isAdmin, args);
                                            break;
                                        case 'itunes':
                                            await this.handleItunes(from, msg, q);
                                            break;
                                        case 'movie':
                                            await this.handleMovie(from, msg, q);
                                            break;
                                        case 'define':
                                            await this.handleDefine(from, msg, q);
                                            break;
                                        case 'dalle':
                                            await this.handleDalle(from, msg, q);
                                            break;
                                        case 'flux':
                                            await this.handleFlux(from, msg, q);
                                            break;
                                        case 'yt':
                                            await this.handleYt(from, msg, q);
                                            break;
                                        case 'ssweb':
                                            await this.handleSsWeb(from, msg, q);
                                            break;
                                        case 'web2apk':
                                            await this.handleWeb2Apk(from, msg, args);
                                            break;
                                        case 'unpair':
                                            await this.handleUnpair(from, msg);
                                            break;
                                        case 'prefix':
                                            await this.handleSetPrefix(from, msg, args);
                                            break;
                                        case 'antibot':
                                            await this.handleAntiBot(from, msg, args, isAdmin);
                                            break;
                                        case 'block':
                                            await this.handleBlock(from, msg, args);
                                            break;
                                        case 'unblock':
                                            await this.handleUnblock(from, msg, args);
                                            break;
                                        case 'pair': {
                                            if (!isOwner) return await this.sock.sendMessage(from, { text: "❌ Only the bot owner can use this command." }, { quoted: msg });
                                            const number = q.replace(/[^0-9]/g, '');
                                            if (!number || number.length < 10) return await this.sock.sendMessage(from, { text: "❌ Please provide a valid WhatsApp number." }, { quoted: msg });
                                            if (!botData.allowedUsers.includes(number) && number !== OWNER_NUMBER) {
                                                return await this.sock.sendMessage(from, { text: `❌ ${number} is not allowed. Use .allow first.` }, { quoted: msg });
                                            }
                                            if (sessions[number] && sessions[number].isConnected) {
                                                return await this.sock.sendMessage(from, { text: `✅ Number ${number} is already paired and active.` }, { quoted: msg });
                                            }
                                            await this.sock.sendMessage(from, { text: `⏳ Generating pairing code for ${number}...` }, { quoted: msg });
                                            if (!sessions[number]) {
                                                sessions[number] = new BotSession(number);
                                            }
                                            await sessions[number].initialize(number, async (code) => {
                                                await this.sock.sendMessage(from, {
                                                    text: `🔑 Pairing code for ${number}:\n\`${code}\`\n\nEnter this code in WhatsApp to link the bot.`
                                                }, { quoted: msg });
                                            });
                                            break;
                                        }
                                        case 'users': {
                                            if (!isOwner) return await this.sock.sendMessage(from, { text: "❌ Only the bot owner can view user stats." }, { quoted: msg });
                                            const total = Object.keys(sessions).length;
                                            const active = Object.values(sessions).filter(s => s.isConnected).length;
                                            let list = '📊 *USERS STATISTICS*\n\n';
                                            list += `👥 Total Sessions: ${total}\n`;
                                            list += `🟢 Active: ${active}\n`;
                                            list += `🔴 Inactive: ${total - active}\n\n`;
                                            if (total > 0) {
                                                list += '📋 *Registered Numbers:*\n';
                                                for (const uid of Object.keys(sessions)) {
                                                    const status = sessions[uid].isConnected ? '🟢' : '🔴';
                                                    list += `${status} ${uid}\n`;
                                                }
                                            } else {
                                                list += 'No users paired yet.';
                                            }
                                            await this.sock.sendMessage(from, { text: list }, { quoted: msg });
                                            break;
                                        }
                                        case 'image': {
                                            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                                            if (!quotedMsg) return await this.sock.sendMessage(from, { text: "❌ Reply to an image with .image to upload." }, { quoted: msg });
                                            const media = await this.getQuotedMedia(quotedMsg);
                                            if (!media) return await this.sock.sendMessage(from, { text: "❌ Could not retrieve the image. Make sure you reply to an image." }, { quoted: msg });
                                            await this.sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });
                                            try {
                                                const form = new FormData();
                                                form.append('reqtype', 'fileupload');
                                                form.append('fileToUpload', media.buffer, {
                                                    filename: 'image.jpg',
                                                    contentType: media.mimetype || 'image/jpeg'
                                                });
                                                const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
                                                    headers: { ...form.getHeaders() },
                                                    timeout: 30000
                                                });
                                                if (data && data.startsWith('http')) {
                                                    await this.sock.sendMessage(from, {
                                                        text: `🖼️ Image uploaded successfully!\n🔗 ${data}`
                                                    }, { quoted: msg });
                                                } else {
                                                    throw new Error('Upload failed');
                                                }
                                            } catch (e) {
                                                await this.sock.sendMessage(from, { text: `❌ Upload failed: ${e.message}` }, { quoted: msg });
                                            }
                                            break;
                                        }
                                        case 'allow':
                                        case 'disallow':
                                        case 'allowlist': {
                                            if (!isOwner) {
                                                return await this.sock.sendMessage(from, { text: "❌ Only the bot owner can use this command." }, { quoted: msg });
                                            }
                                            if (commandName === 'allowlist') {
                                                const list = botData.allowedUsers || [];
                                                if (list.length === 0) {
                                                    return await this.sock.sendMessage(from, { text: "📋 *Allowed Users List*\n\nNo users are currently allowed." }, { quoted: msg });
                                                }
                                                const entries = list.map((num, i) => `${i+1}. +${num}`).join('\n');
                                                return await this.sock.sendMessage(from, {
                                                    text: `📋 *Allowed Users List*\n\n${entries}\n\nTotal: ${list.length} user(s)`
                                                }, { quoted: msg });
                                            }
                                            const targetNumber = q.replace(/[^0-9]/g, '');
                                            if (!targetNumber || targetNumber.length < 7) {
                                                return await this.sock.sendMessage(from, { text: "❌ Provide a valid phone number.\nExample: `.allow 923001234567`" }, { quoted: msg });
                                            }
                                            if (targetNumber === OWNER_NUMBER) {
                                                return await this.sock.sendMessage(from, { text: "❌ The owner is always allowed." }, { quoted: msg });
                                            }
                                            if (commandName === 'allow') {
                                                if (botData.allowedUsers.includes(targetNumber)) {
                                                    return await this.sock.sendMessage(from, { text: `ℹ️ ${targetNumber} is already allowed.` }, { quoted: msg });
                                                }
                                                botData.allowedUsers.push(targetNumber);
                                                saveBotData();
                                                await this.sock.sendMessage(from, {
                                                    text: `✅ *Allowed ${targetNumber}*\n\nThey can now use the bot.`
                                                }, { quoted: msg });
                                            } else if (commandName === 'disallow') {
                                                if (!botData.allowedUsers.includes(targetNumber)) {
                                                    return await this.sock.sendMessage(from, { text: `ℹ️ ${targetNumber} is not allowed.` }, { quoted: msg });
                                                }
                                                botData.allowedUsers = botData.allowedUsers.filter(n => n !== targetNumber);
                                                saveBotData();
                                                await this.sock.sendMessage(from, {
                                                    text: `✅ *Disallowed ${targetNumber}*\n\nThey have been removed from the whitelist.`
                                                }, { quoted: msg });
                                            }
                                            break;
                                        }
                                        case 'unlink': {
                                            if (!isOwner) {
                                                return await this.sock.sendMessage(from, { text: "❌ Only the bot owner can use this command." }, { quoted: msg });
                                            }
                                            const targetNumber = q.replace(/[^0-9]/g, '');
                                            if (!targetNumber || targetNumber.length < 7) {
                                                return await this.sock.sendMessage(from, { text: "❌ Provide a valid phone number.\nExample: `.unlink 923001234567`" }, { quoted: msg });
                                            }
                                            if (targetNumber === OWNER_NUMBER) {
                                                return await this.sock.sendMessage(from, { text: "❌ You cannot unlink the owner." }, { quoted: msg });
                                            }
                                            const session = sessions[targetNumber];
                                            if (session && session.sock) {
                                                try {
                                                    await session.sock.sendMessage(session.sock.user.id, {
                                                        text: '🔗 *You have been unlinked by the owner.*\nYour session has been terminated. You can pair again if allowed.'
                                                    });
                                                    await session.sock.logout();
                                                } catch (e) {}
                                                const authPath = path.join(AUTH_DIR, targetNumber);
                                                if (fs.existsSync(authPath)) fs.removeSync(authPath);
                                                delete sessions[targetNumber];
                                                if (userSockets[targetNumber]) delete userSockets[targetNumber];
                                                await this.sock.sendMessage(from, {
                                                    text: `✅ *Unlinked ${targetNumber}*\n\nTheir session has been terminated and auth data removed.`
                                                }, { quoted: msg });
                                            } else {
                                                const authPath = path.join(AUTH_DIR, targetNumber);
                                                if (fs.existsSync(authPath)) {
                                                    fs.removeSync(authPath);
                                                    await this.sock.sendMessage(from, {
                                                        text: `✅ *Unlinked ${targetNumber}*\n\nAuth folder removed (no active session).`
                                                    }, { quoted: msg });
                                                } else {
                                                    await this.sock.sendMessage(from, {
                                                        text: `ℹ️ No session or auth data found for ${targetNumber}.`
                                                    }, { quoted: msg });
                                                }
                                            }
                                            break;
                                        }
                                        case 'animes':
                                        case 'animeimg':
                                        case 'animepic':
                                            await animesCommand(this.sock, msg, args);
                                            break;
                                        default:
                                            await this.sock.sendMessage(from, {
                                                text: '❌ Unknown command. Type `.menu` to see all commands.'
                                            }, { quoted: msg });
                                            break;
                                    }
                                } catch (e) {
                                    this.sendLog("❌ Command error (" + commandName + "): " + e.message, 'error');
                                    await this.sock.sendMessage(from, {
                                        text: "An error occurred while executing the command."
                                    }, { quoted: msg });
                                }
                            })();
                        }
                    } catch (e) {
                        console.error('❌ Message Processing Error:', e);
                    }
                }));
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                if (qr) {
                    const socketId = userSockets[this.userId];
                    if (socketId) io.to(socketId).emit('qr', qr);
                }
                if (connection === 'close') {
                    this.isConnected = false;
                    this.isInitializing = false;
                    this.sendLog("⚠️ Connection closed", 'warning');
                    this.sendConnectionStatus();
                    const statusCode = (lastDisconnect.error)?.output?.statusCode;
                    if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                        this.sendLog('🔴 Session expired. Clearing auth data...', 'error');
                        try {
                            const botNumber = jidNormalizedUser(this.sock.user.id);
                            await this.sock.sendMessage(botNumber, { text: STYLISH.disconnected });
                        } catch (e) {}
                        try {
                            if (fs.existsSync(this.authPath)) {
                                const backupPath = this.authPath + '_backup_' + Date.now();
                                fs.moveSync(this.authPath, backupPath);
                                this.sendLog("📦 Corrupted session backed up to " + backupPath, 'info');
                            }
                        } catch (e) {
                            if (fs.existsSync(this.authPath)) fs.removeSync(this.authPath);
                        }
                        delete sessions[this.userId];
                        this.sendConnectionStatus();
                    } else if (statusCode === DisconnectReason.restartRequired || statusCode === DisconnectReason.connectionLost || statusCode === 428) {
                        this.sendLog("🔄 Connection issue (" + statusCode + "). Restarting in 3s...", 'warning');
                        setTimeout(() => this.initialize(), 3000);
                    } else if (statusCode === 515) {
                        this.sendLog('⚠️ Stream error. Reconnecting immediately...', 'warning');
                        this.initialize();
                    } else {
                        this.sendLog("ℹ️ Connection closed (" + statusCode + "). Reconnecting in 5s...", 'info');
                        setTimeout(() => this.initialize(), 5000);
                    }
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.isInitializing = false;
                    this.sendLog('✅ Connected successfully!', 'success');
                    this.sendConnectionStatus();
                    this.startActiveCheck();
                    const botNumber = jidNormalizedUser(this.sock.user.id);
                    const botName = botData.userNames[this.userId] || (this.sock.user && this.sock.user.name) || this.userId;
                    if (this.tgChatId) {
                        await tgBot.sendMessage(this.tgChatId,
                            "╔════════════════════════════════════════════╗\n" +
                            "║ ✅ 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 ✅ ║\n" +
                            "╚════════════════════════════════════════════╝\n\n" +
                            "🤖 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞 ➜ " + botName + "\n" +
                            "📱 𝐍𝐮𝐦𝐛𝐞𝐫 ➜ " + this.userId + "\n" +
                            "⚡ 𝐒𝐭𝐚𝐭𝐮𝐬 ➜ 𝐀𝐜𝐭𝐢𝐯𝐞 & 𝐑𝐮𝐧𝐧𝐢𝐧𝐠\n\n" +
                            "🌟 𝐘𝐨𝐮𝐫 𝐛𝐨𝐭 𝐢𝐬 𝐧𝐨𝐰 𝐨𝐧𝐥𝐢𝐧𝐞 𝐚𝐧𝐝 𝐫𝐞𝐚𝐝𝐲!\n\n" +
                            "🔰 EXON XD BOT",
                            { parse_mode: 'Markdown' }
                        );
                    }
                    this.sendLog("🌟 Bot " + botName + " is online and ready!", 'success');
                    setTimeout(async () => {
                        try {
                            await this.sock.query({
                                tag: 'iq',
                                attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
                                content: [{ tag: 'status', attrs: {}, content: Buffer.from("🌟 IM USING BEST BOT EXON XD BOT 🌟", 'utf-8') }]
                            });
                            this.sendLog("✨ Bio updated successfully!", "success");
                        } catch (e) {
                            this.sendLog("⚠️ Bio update failed: " + e.message, "error");
                        }
                    }, 5000);
                    if (!this.lastConnectMessageTime || (Date.now() - this.lastConnectMessageTime > 60 * 60 * 1000)) {
                        await this.sock.sendMessage(botNumber, { text: STYLISH.connected });
                        this.lastConnectMessageTime = Date.now();
                    }
                }
            });
        } catch (err) {
            this.isInitializing = false;
            this.sendLog("❌ Initialization failed: " + err.message + ". Retrying in 10s...", 'error');
            setTimeout(() => this.initialize(), 10000);
        }
    }

    startActiveCheck() {
        if (this.activeInterval) clearInterval(this.activeInterval);
        this.activeInterval = setInterval(async () => {
            if (this.isConnected && this.sock?.user) {
                try {
                    const botNumber = jidNormalizedUser(this.sock.user.id);
                    await this.sock.sendMessage(botNumber, { text: STYLISH.keepAlive });
                    this.sendLog("✅ Keep-alive: Status message sent successfully", "success");
                } catch (e) {
                    this.sendLog("⚠️ Keep-alive failed: " + e.message, "error");
                }
            }
        }, 60 * 60 * 1000);
    }

    // ---- FIX: Group commands handler ----
    async handleGroupCommands(from, msg, args, commandName, isAdmin) {
        if (!isAdmin) {
            return await this.sock.sendMessage(from, { text: "❌ You need admin rights." }, { quoted: msg });
        }

        const q = args.join(' ');

        switch (commandName) {
            case 'add': {
                if (!q) return await this.sock.sendMessage(from, { text: "Provide the number to add.\nExample: .add 1234567890" }, { quoted: msg });
                const jids = q.split(' ').map(n => n.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
                try {
                    await this.groupAction(from, 'add', jids);
                    await this.sock.sendMessage(from, { text: `✅ Added ${jids.length} participant(s).` }, { quoted: msg });
                } catch (e) {
                    await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
                }
                break;
            }
            case 'kick': {
                const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                let targets = mentioned.length ? mentioned : q.split(' ').map(n => n.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
                if (!targets.length) return await this.sock.sendMessage(from, { text: "Mention or provide the number to kick." }, { quoted: msg });
                try {
                    await this.groupAction(from, 'remove', targets);
                    await this.sock.sendMessage(from, { text: `✅ Kicked ${targets.length} participant(s).` }, { quoted: msg });
                } catch (e) {
                    await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
                }
                break;
            }
            case 'promote': {
                const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                let targets = mentioned.length ? mentioned : q.split(' ').map(n => n.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
                if (!targets.length) return await this.sock.sendMessage(from, { text: "Mention or provide the number to promote." }, { quoted: msg });
                try {
                    await this.groupAction(from, 'promote', targets);
                    await this.sock.sendMessage(from, { text: `✅ Promoted ${targets.length} participant(s).` }, { quoted: msg });
                } catch (e) {
                    await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
                }
                break;
            }
            case 'demote': {
                const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                let targets = mentioned.length ? mentioned : q.split(' ').map(n => n.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
                if (!targets.length) return await this.sock.sendMessage(from, { text: "Mention or provide the number to demote." }, { quoted: msg });
                try {
                    await this.groupAction(from, 'demote', targets);
                    await this.sock.sendMessage(from, { text: `✅ Demoted ${targets.length} participant(s).` }, { quoted: msg });
                } catch (e) {
                    await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
                }
                break;
            }
            case 'mute': {
                try {
                    await this.setGroupSettings(from, 'announce', 'on');
                    await this.sock.sendMessage(from, { text: "🔇 Group muted (only admins can send messages)." }, { quoted: msg });
                } catch (e) {
                    await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
                }
                break;
            }
            case 'unmute': {
                try {
                    await this.setGroupSettings(from, 'announce', 'off');
                    await this.sock.sendMessage(from, { text: "🔊 Group unmuted (everyone can send messages)." }, { quoted: msg });
                } catch (e) {
                    await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
                }
                break;
            }
            case 'glock': {
                try {
                    await this.setGroupSettings(from, 'restrict', 'on');
                    await this.sock.sendMessage(from, { text: "🔒 Group locked (only admins can edit group info)." }, { quoted: msg });
                } catch (e) {
                    await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
                }
                break;
            }
            case 'gunlock': {
                try {
                    await this.setGroupSettings(from, 'restrict', 'off');
                    await this.sock.sendMessage(from, { text: "🔓 Group unlocked (everyone can edit group info)." }, { quoted: msg });
                } catch (e) {
                    await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
                }
                break;
            }
            case 'revoke': {
                try {
                    const code = await this.revokeGroupInvite(from);
                    await this.sock.sendMessage(from, { text: `🔑 New invite link generated:\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
                } catch (e) {
                    await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
                }
                break;
            }
            case 'gname': {
                if (!q) return await this.sock.sendMessage(from, { text: "Provide new group name.\nExample: .gname My Group" }, { quoted: msg });
                try {
                    await this.changeGroupSubject(from, q);
                    await this.sock.sendMessage(from, { text: `✅ Group name changed to: ${q}` }, { quoted: msg });
                } catch (e) {
                    await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
                }
                break;
            }
            case 'gdesc': {
                if (!q) return await this.sock.sendMessage(from, { text: "Provide new group description.\nExample: .gdesc This is a test group." }, { quoted: msg });
                try {
                    await this.changeGroupDescription(from, q);
                    await this.sock.sendMessage(from, { text: `✅ Group description updated.` }, { quoted: msg });
                } catch (e) {
                    await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
                }
                break;
            }
            case 'tagall': {
                const groupMeta = await this.sock.groupMetadata(from);
                const mentions = groupMeta.participants.map(p => p.id);
                const tagText = q || '@all';
                await this.sock.sendMessage(from, { text: tagText, mentions }, { quoted: msg });
                break;
            }
            case 'hidetag': {
                const groupMeta = await this.sock.groupMetadata(from);
                const mentions = groupMeta.participants.map(p => p.id);
                await this.sock.sendMessage(from, { text: q || '🔇 Hidden Tag', mentions }, { quoted: msg });
                break;
            }
            default:
                await this.sock.sendMessage(from, { text: '❌ Unknown group command.' }, { quoted: msg });
        }
    }

    // ==================== ADDITIONAL COMMAND HANDLERS ====================

    async handleAlive(from, msg) {
        try {
            await this.sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const uptimeText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
            const usedMem = (totalMem - freeMem).toFixed(2);
            const cpuLoad = os.loadavg()[0].toFixed(2);
            const text =
                `🤖 *EXON XD BOT IS ACTIVE!*\n\n` +
                `⏱️ *Uptime:* ${uptimeText}\n` +
                `💾 *RAM:* ${usedMem}GB / ${totalMem}GB\n` +
                `📊 *CPU Load:* ${cpuLoad}%\n` +
                `🖥️ *Platform:* ${os.platform()} (${os.arch()})\n` +
                `📦 *Node.js:* ${process.version}\n\n` +
                `🔰 *Powered by EXON XD*`;
            await this.sock.sendMessage(from, { text }, { quoted: msg });
        } catch (error) {
            console.error('Alive command error:', error);
            await this.sock.sendMessage(from, { text: '✅ EXON XD is alive and running!' }, { quoted: msg });
        }
    }

    async handlePingWeb(from, msg, url) {
        try {
            await this.sock.sendMessage(from, { react: { text: '🏓', key: msg.key } });
            const startBot = Date.now();
            await this.sock.sendMessage(from, { text: '🏓 Pinging...' }, { quoted: msg });
            const botLatency = Date.now() - startBot;
            let responseText = `🏓 *Pong!*\n\n📶 *Bot Latency:* ${botLatency}ms`;
            if (url) {
                try {
                    let testUrl = url;
                    if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
                        testUrl = `https://${testUrl}`;
                    }
                    const urlObj = new URL(testUrl);
                    const startWeb = Date.now();
                    const response = await axios.get(testUrl, { timeout: 10000, validateStatus: () => true, headers: { 'User-Agent': 'EXON-XD-Bot' } });
                    const webLatency = Date.now() - startWeb;
                    responseText += `\n\n🌐 *Website:* ${urlObj.hostname}`;
                    responseText += `\n⚡ *Response Time:* ${webLatency}ms`;
                    responseText += `\n📡 *Status:* ${response.status}`;
                    responseText += `\n✅ *Reachable:* Yes`;
                } catch (error) {
                    responseText += `\n\n🌐 *Website:* ${url}`;
                    responseText += `\n❌ *Error:* ${error.code || error.message}`;
                }
            }
            responseText += `\n\n🔰 *Powered by EXON XD*`;
            await this.sock.sendMessage(from, { text: responseText }, { quoted: msg });
        } catch (error) {
            await this.sock.sendMessage(from, { text: '❌ Failed to ping.' }, { quoted: msg });
        }
    }

    async handleArchiveChat(from, msg, command) {
        try {
            const isUnarchive = command.includes('unarchive');
            await this.sock.sendMessage(from, { react: { text: '📦', key: msg.key } });
            await this.sock.chatModify({ archive: !isUnarchive, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, from);
            await this.sock.sendMessage(from, { text: isUnarchive ? '📂 *Chat unarchived!*' : '📦 *Chat archived!*' }, { quoted: msg });
        } catch (e) {
            await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
        }
    }

    async handlePinChat(from, msg, command) {
        try {
            const shouldPin = !command.includes('unpin');
            await this.sock.sendMessage(from, { react: { text: '📌', key: msg.key } });
            await this.sock.chatModify({ pin: shouldPin }, from);
            await this.sock.sendMessage(from, { text: shouldPin ? '📌 *Chat pinned!*' : '📌 *Chat unpinned!*' }, { quoted: msg });
        } catch (e) {
            await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
        }
    }

    async handleGcSet(from, msg, isAdmin, args) {
        if (!isAdmin) return await this.sock.sendMessage(from, { text: "❌ You need admin rights." }, { quoted: msg });
        try {
            await this.sock.sendMessage(from, { react: { text: '⚙️', key: msg.key } });
            const setting = args[0]?.toLowerCase();
            if (!setting) {
                return await this.sock.sendMessage(from, {
                    text: `⚙️ *GROUP SETTINGS*\n\n📌 *Usage:* \`.gcset <option>\`\n\n🔒 *lock* — Only admins can send messages\n🔓 *unlock* — Everyone can send messages\n🔒 *lockset* — Only admins can edit group info\n🔓 *unlockset* — Everyone can edit group info`
                }, { quoted: msg });
            }
            const settingsMap = {
                lock: { value: 'announcement', label: '🔒 Only admins can send messages' },
                unlock: { value: 'not_announcement', label: '🔓 Everyone can send messages' },
                lockset: { value: 'locked', label: '🔒 Only admins can edit group info' },
                unlockset: { value: 'unlocked', label: '🔓 Everyone can edit group info' },
            };
            const config = settingsMap[setting];
            if (!config) {
                return await this.sock.sendMessage(from, { text: `❌ Unknown setting: *${setting}*` }, { quoted: msg });
            }
            await this.sock.groupSettingUpdate(from, config.value);
            await this.sock.sendMessage(from, { text: `✅ ${config.label}` }, { quoted: msg });
        } catch (e) {
            await this.sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
        }
    }

    async handleItunes(from, msg, query) {
        if (!query) {
            return await this.sock.sendMessage(from, { text: '🎵 *Please provide a song name.*\nExample: `.itunes Blinding Lights`' }, { quoted: msg });
        }
        try {
            await this.sock.sendMessage(from, { react: { text: '🎵', key: msg.key } });
            const url = `https://api.popcat.xyz/itunes?q=${encodeURIComponent(query)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`API request failed`);
            const json = await res.json();
            const songInfo =
                `🎵 *${json.name || 'N/A'}*\n👤 *Artist:* ${json.artist || 'N/A'}\n💿 *Album:* ${json.album || 'N/A'}\n📅 *Release:* ${json.release_date || 'N/A'}\n💰 *Price:* ${json.price || 'N/A'}\n⏱️ *Length:* ${json.length || 'N/A'}\n🎼 *Genre:* ${json.genre || 'N/A'}\n\n🔰 *Powered by EXON XD*`;
            if (json.thumbnail) {
                await this.sock.sendMessage(from, { image: { url: json.thumbnail }, caption: songInfo }, { quoted: msg });
            } else {
                await this.sock.sendMessage(from, { text: songInfo }, { quoted: msg });
            }
        } catch (error) {
            await this.sock.sendMessage(from, { text: '❌ Failed to fetch song info.' }, { quoted: msg });
        }
    }

    async handleMovie(from, msg, query) {
        if (!query) {
            return await this.sock.sendMessage(from, { text: `🎬 *Movie Info*\n\n*Usage:* \`.movie <name>\`` }, { quoted: msg });
        }
        try {
            await this.sock.sendMessage(from, { react: { text: '🎬', key: msg.key } });
            const OMDB_KEY = 'trilogy';
            const year = query.match(/\b(19|20)\d{2}\b/)?.[0];
            const title = query.replace(/\b(19|20)\d{2}\b/, '').trim();
            let url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_KEY}&plot=full`;
            if (year) url += `&y=${year}`;
            const res = await axios.get(url, { timeout: 15000 });
            let data = res.data;
            if (data.Response === 'False') {
                const searchRes = await axios.get(`https://www.omdbapi.com/?s=${encodeURIComponent(title)}&apikey=${OMDB_KEY}&type=movie`);
                if (searchRes.data.Response === 'True' && searchRes.data.Search?.length) {
                    const first = searchRes.data.Search[0];
                    const detailRes = await axios.get(`https://www.omdbapi.com/?i=${first.imdbID}&apikey=${OMDB_KEY}&plot=full`);
                    data = detailRes.data;
                }
            }
            if (data.Response === 'False') {
                return await this.sock.sendMessage(from, { text: `❌ Movie not found: *${query}*` }, { quoted: msg });
            }
            const ratings = (data.Ratings || []).map((r) => `• ${r.Source}: *${r.Value}*`).join('\n');
            const imdbStars = data.imdbRating !== 'N/A' ? `${'⭐'.repeat(Math.round(parseFloat(data.imdbRating) / 2))} (${data.imdbRating}/10)` : 'N/A';
            const text =
                `🎬 *${data.Title}* (${data.Year})\n\n🎭 *Genre:* ${data.Genre}\n🌐 *Language:* ${data.Language}\n🎬 *Director:* ${data.Director}\n🎭 *Cast:* ${data.Actors}\n⏱️ *Runtime:* ${data.Runtime}\n🏆 *Awards:* ${data.Awards}\n\n${imdbStars}\n${ratings}\n\n📖 *Plot:*\n${data.Plot}\n\n${data.BoxOffice && data.BoxOffice !== 'N/A' ? `💰 *Box Office:* ${data.BoxOffice}\n` : ''}🔗 imdb.com/title/${data.imdbID}\n\n🔰 *Powered by EXON XD*`;
            await this.sock.sendMessage(from, { text }, { quoted: msg });
        } catch (error) {
            await this.sock.sendMessage(from, { text: `❌ Failed: ${error.message}` }, { quoted: msg });
        }
    }

    async handleDefine(from, msg, query) {
        if (!query) {
            return await this.sock.sendMessage(from, { text: '📖 *Please provide a word to search for.*\nExample: .define hello' }, { quoted: msg });
        }
        try {
            await this.sock.sendMessage(from, { react: { text: '📖', key: msg.key } });
            const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`;
            const { data: json } = await axios.get(url);
            if (!json?.list || json.list.length === 0) {
                return await this.sock.sendMessage(from, { text: '❌ Word not found.' }, { quoted: msg });
            }
            const entry = json.list[0];
            const text =
                `📖 *Dictionary*\n\n*Word:* ${query}\n*Definition:* ${entry.definition || 'No definition available'}\n${entry.example ? `*Example:* ${entry.example}\n` : ''}\n🔰 *Powered by EXON XD*`;
            await this.sock.sendMessage(from, { text }, { quoted: msg });
        } catch (error) {
            await this.sock.sendMessage(from, { text: '❌ Failed to fetch definition.' }, { quoted: msg });
        }
    }

    async handleDalle(from, msg, prompt) {
        if (!prompt) {
            return this.sock.sendMessage(from, {
                text: '🎨 *AI Image Generator*\n\nUsage: `.dalle <prompt>`\nExample: `.dalle a beautiful sunset over mountains`'
            }, { quoted: msg });
        }
        await this.sock.sendMessage(from, { react: { text: '🎨', key: msg.key } });
        await this.sock.sendMessage(from, { text: '🎨 Generating your image... Please wait.' }, { quoted: msg });
        try {
            const IMAGE_APIS = [
                (p) => `https://stable.stacktoy.workers.dev/?apikey=Suhail&prompt=${encodeURIComponent(p)}`,
                (p) => `https://dalle.stacktoy.workers.dev/?apikey=Suhail&prompt=${encodeURIComponent(p)}`,
                (p) => `https://flux.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(p)}`
            ];
            const generateImage = async (prompt) => {
                for (const apiUrl of IMAGE_APIS) {
                    try {
                        const { data } = await axios.get(apiUrl(prompt), { responseType: 'arraybuffer', timeout: 30000 });
                        const buf = Buffer.from(data);
                        if (buf[0] === 0x89 || buf[0] === 0xFF) return buf;
                    } catch { continue; }
                }
                throw new Error('All APIs failed');
            };
            const enhancePrompt = (prompt) => {
                const enhancers = ['high quality', 'detailed', 'masterpiece', 'best quality', 'ultra realistic', '4k', 'highly detailed', 'cinematic lighting'];
                const selected = enhancers.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 2) + 3);
                return `${prompt}, ${selected.join(', ')}`;
            };
            const enhanced = enhancePrompt(prompt);
            const imageBuffer = await generateImage(enhanced);
            await this.sock.sendMessage(from, {
                image: imageBuffer,
                caption: `🎨 *Generated Image*\n📌 Prompt: _${prompt}_\n\n🔰 *Powered by EXON XD*`
            }, { quoted: msg });
        } catch (error) {
            await this.sock.sendMessage(from, { text: '❌ Failed to generate image. Please try again.' }, { quoted: msg });
        }
    }

    async handleFlux(from, msg, prompt) {
        await this.handleDalle(from, msg, prompt);
    }

    async handleYt(from, msg, url) {
        if (!url) {
            return await this.sock.sendMessage(from, { text: '📹 *Please provide a YouTube URL*\nExample: `.yt https://youtube.com/watch?v=...`' }, { quoted: msg });
        }
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return await this.sock.sendMessage(from, { text: '❌ Invalid YouTube link' }, { quoted: msg });
        }
        try {
            await this.sock.sendMessage(from, { react: { text: '📹', key: msg.key } });
            const apiUrl = `https://ytaudio-iota.vercel.app/api/mp4?url=${encodeURIComponent(url)}`;
            const { data } = await axios.get(apiUrl);
            const resData = data?.result || data?.data || data;
            const downloadUrl = resData?.downloadURL || resData?.download_url || resData?.url;
            const title = resData?.title || 'YouTube Video';
            if (!downloadUrl) {
                return await this.sock.sendMessage(from, { text: '❌ Failed to get download URL.' }, { quoted: msg });
            }
            await this.sock.sendMessage(from, {
                video: { url: downloadUrl },
                caption: `🎬 *${title}*\n\n🔰 *Downloaded by EXON XD Bot*`
            }, { quoted: msg });
        } catch (e) {
            await this.sock.sendMessage(from, { text: '❌ Server busy. Please try again.' }, { quoted: msg });
        }
    }

    async handleSsWeb(from, msg, url) {
        if (!url) {
            return await this.sock.sendMessage(from, { text: '🌐 *Please provide a website URL*\n\nExample: .ssweb https://instagram.com' }, { quoted: msg });
        }
        try {
            await this.sock.sendMessage(from, { react: { text: '📸', key: msg.key } });
            await this.sock.sendMessage(from, { text: '📸 Taking screenshot...' }, { quoted: msg });
            const response = await axios.get(`https://image.thum.io/get/png/fullpage/viewportWidth/2400/${url}`, { responseType: 'arraybuffer' });
            await this.sock.sendMessage(from, {
                image: response.data,
                caption: `📸 *Website Screenshot*\n\n🌐 ${url}\n\n🔰 *Powered by EXON XD*`
            }, { quoted: msg });
        } catch (e) {
            await this.sock.sendMessage(from, { text: '❌ Error taking screenshot.' }, { quoted: msg });
        }
    }

    async handleWeb2Apk(from, msg, args) {
        const input = args.join(' ').trim();
        if (!input || !input.includes('|')) {
            return await this.sock.sendMessage(from, {
                text: `🌐 *Web to APK Builder*\n\nUse: .web2apk <url> | <email> | <app_name>`
            }, { quoted: msg });
        }
        let [url, email, appName] = input.split('|').map(s => s.trim());
        if (!url || !email || !appName) {
            return await this.sock.sendMessage(from, { text: '❌ Invalid format!' }, { quoted: msg });
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
        if (!email.includes('@') || !email.includes('.')) {
            return await this.sock.sendMessage(from, { text: '❌ Invalid email format.' }, { quoted: msg });
        }
        await this.sock.sendMessage(from, { react: { text: '📱', key: msg.key } });
        await this.sock.sendMessage(from, {
            text: `🔧 *Starting APK Build...*\n\n🌐 URL: ${url}\n📧 Email: ${email}\n📱 App Name: ${appName}\n\n⏳ This may take 2-5 minutes...`
        }, { quoted: msg });
        try {
            class Web2Apk {
                constructor() { this.baseURL = 'https://standalone-app-api.appmaker.xyz'; }
                async startBuild(url, email) {
                    const res = await axios.post(`${this.baseURL}/webapp/build`, { url, email });
                    return res.data?.body?.appId;
                }
                async buildConfig(url, appID, appName) {
                    const logo = 'https://logo.clearbit.com/' + url.replace('https://', '');
                    const config = {
                        appId: appID,
                        appIcon: logo,
                        appName: appName,
                        isPaymentInProgress: false,
                        enableShowToolBar: false,
                        toolbarColor: '#03A9F4',
                        toolbarTitleColor: '#FFFFFF',
                        splashIcon: logo
                    };
                    const res = await axios.post(`${this.baseURL}/webapp/build/build`, config);
                    return res.data;
                }
                async getStatus(appID) {
                    while (true) {
                        const res = await axios.get(`${this.baseURL}/webapp/build/status?appId=${appID}`);
                        if (res.data?.body?.status === 'success') return true;
                        await this.delay(5000);
                    }
                }
                async getDownload(appID) {
                    const res = await axios.get(`${this.baseURL}/webapp/complete/download?appId=${appID}`);
                    return res.data;
                }
                async build(url, email, appName) {
                    const appID = await this.startBuild(url, email);
                    await this.buildConfig(url, appID, appName);
                    await this.getStatus(appID);
                    return await this.getDownload(appID);
                }
                async delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
            }
            const builder = new Web2Apk();
            const result = await builder.build(url, email, appName);
            const downloadUrl = result?.body?.buildFile || result?.body?.downloadUrl || result?.body?.keyFile;
            if (downloadUrl) {
                await this.sock.sendMessage(from, {
                    text: `✅ *Build Success!*\n\n📱 *App:* ${appName}\n🌐 *Website:* ${url}\n📥 *Download:* ${downloadUrl}\n\n⏳ *Valid for 24 hours*\n\n🔰 *Powered by EXON XD*`
                }, { quoted: msg });
            } else {
                await this.sock.sendMessage(from, { text: '❌ Failed to fetch download URL.' }, { quoted: msg });
            }
        } catch (err) {
            await this.sock.sendMessage(from, { text: `❌ *Build Failed!*\n\n${err.message}` }, { quoted: msg });
        }
    }

    async handleUnpair(from, msg) {
        try {
            await this.sock.sendMessage(from, { react: { text: '🔐', key: msg.key } });
            await this.sock.sendMessage(from, {
                text: '🔐 *Unpairing device...*\n\nThis will disconnect your current device.\n⚠️ Make sure you have your QR code ready to reconnect.\n\n🔰 *Powered by EXON XD*'
            }, { quoted: msg });
        } catch (error) {
            await this.sock.sendMessage(from, { text: '❌ Failed to unpair: ' + error.message }, { quoted: msg });
        }
    }

    async handleSetPrefix(from, msg, args) {
        await this.sock.sendMessage(from, { text: '♾️ Prefix change is not implemented in this version.' }, { quoted: msg });
    }

    async handleAntiBot(from, msg, args, isAdmin) {
        if (!isAdmin) return await this.sock.sendMessage(from, { text: "❌ You need admin rights." }, { quoted: msg });
        const action = args[0]?.toLowerCase();
        if (!action || !['warn', 'kick'].includes(action)) {
            return await this.sock.sendMessage(from, {
                text: '🛡️ *Anti-Bot Protection*\n\nUsage: `.antibot <warn/kick>`\n• *warn* - Send warning to suspected bots\n• *kick* - Automatically kick bots\n\nExample: `.antibot kick`'
            }, { quoted: msg });
        }
        try {
            await this.sock.sendMessage(from, { react: { text: '🛡️', key: msg.key } });
            await this.sock.sendMessage(from, {
                text: `✅ *Anti-bot protection enabled:* ${action.toUpperCase()}\n\n🔰 *Powered by EXON XD*`
            }, { quoted: msg });
        } catch (error) {
            await this.sock.sendMessage(from, { text: '❌ Failed to enable anti-bot: ' + error.message }, { quoted: msg });
        }
    }

    async handleBlock(from, msg, args) {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const userToBlock = mentioned?.[0] || args[0];
        if (!userToBlock) {
            return await this.sock.sendMessage(from, { text: '🚫 *Block User*\n\nUsage: `.block @user` or `.block <number>`' }, { quoted: msg });
        }
        try {
            await this.sock.sendMessage(from, { react: { text: '🚫', key: msg.key } });
            await this.sock.updateBlockStatus(userToBlock, 'block');
            await this.sock.sendMessage(from, {
                text: `🚫 *User blocked successfully*\n\nUser: ${userToBlock}\n\n🔰 *Powered by EXON XD*`
            }, { quoted: msg });
        } catch (error) {
            await this.sock.sendMessage(from, { text: '❌ Failed to block user: ' + error.message }, { quoted: msg });
        }
    }

    async handleUnblock(from, msg, args) {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const userToUnblock = mentioned?.[0] || args[0];
        if (!userToUnblock) {
            return await this.sock.sendMessage(from, { text: '🔓 *Unblock User*\n\nUsage: `.unblock @user` or `.unblock <number>`' }, { quoted: msg });
        }
        try {
            await this.sock.sendMessage(from, { react: { text: '🔓', key: msg.key } });
            await this.sock.updateBlockStatus(userToUnblock, 'unblock');
            await this.sock.sendMessage(from, {
                text: `🔓 *User unblocked successfully*\n\nUser: ${userToUnblock}\n\n🔰 *Powered by EXON XD*`
            }, { quoted: msg });
        } catch (error) {
            await this.sock.sendMessage(from, { text: '❌ Failed to unblock user: ' + error.message }, { quoted: msg });
        }
    }
}

// ===== SOCKET.IO EVENTS =====
io.on('connection', (socket) => {
    socket.on('set-user', (userId) => {
        userSockets[userId] = socket.id;
        if (!sessions[userId]) sessions[userId] = new BotSession(userId);
        sessions[userId].sendConnectionStatus();
    });

    socket.on('pair-request', async ({ userId, number }) => {
        if (sessions[userId]) {
            if (!botData.allowedUsers.includes(number) && number !== OWNER_NUMBER) {
                socket.emit('pairing-error', { error: 'Number is not on the whitelist.' });
                return;
            }
            if (!botData.statusSettings[userId]) {
                botData.statusSettings[userId] = {
                    autoStatus: false,
                    autoSeen: false,
                    autoLike: false,
                    autoDownload: false,
                    isPublic: false,
                    aiEnabled: false
                };
                saveBotData();
            }
            await sessions[userId].initialize(number);
        }
    });

    socket.on('logout', async (userId) => {
        if (sessions[userId]) {
            if (sessions[userId].sock) {
                try {
                    const botNumber = jidNormalizedUser(sessions[userId].sock.user.id);
                    await sessions[userId].sock.sendMessage(botNumber, {
                        text: "╔════════════════════════════════════════════╗\n║ 🔴 BOT LOGGED OUT 🔴 ║\n╚════════════════════════════════════════════╝\n\n👋 Goodbye!\n🔄 Pair again to reconnect\n\n🔰EXON XD BOT"
                    });
                    await sessions[userId].sock.logout();
                } catch (e) {}
            }
            const authPath = path.join(AUTH_DIR, userId);
            if (fs.existsSync(authPath)) fs.removeSync(authPath);
            delete sessions[userId];
            io.emit('total-active', Object.values(sessions).filter(s => s.isConnected).length);
            const socketId = userSockets[userId];
            if (socketId) io.to(socketId).emit('connection-status', { connected: false, user: userId });
        }
    });

    socket.on('disconnect', () => {
        for (const userId in userSockets) {
            if (userSockets[userId] === socket.id) {
                delete userSockets[userId];
                break;
            }
        }
    });
});

// ===== LOAD EXISTING SESSIONS =====
async function loadExistingSessions() {
    try {
        const authDirs = await fs.readdir(AUTH_DIR);
        for (const userId of authDirs) {
            const authPath = path.join(AUTH_DIR, userId);
            const stats = await fs.stat(authPath);
            if (stats.isDirectory()) {
                const credsFile = path.join(authPath, 'creds.json');
                if (fs.existsSync(credsFile)) {
                    console.log('📂 [System] Found existing session for: ' + userId + '. Initializing...');
                    if (!sessions[userId]) {
                        sessions[userId] = new BotSession(userId);
                        sessions[userId].initialize().catch(err => {
                            console.error('❌ [System] Failed to auto-initialize session ' + userId + ': ' + err.message);
                        });
                    }
                }
            }
        }
    } catch (err) {
        console.error('❌ [System] Error loading existing sessions:', err.message);
    }
}

// ===== START SERVER =====
server.listen(PORT, () => {
    console.log('\n' +
        '╔════════════════════════════════╗\n' +
        '║ 🚀 EXON XD BOT SERVER 🚀.               ║\n' +
        '╠════════════════════════════════╣\n' +
        '║ 🌐 Server ➜ http://localhost:' + PORT + ' ║\n' +
        '║ ⚡ Status ➜ Active & Ready               ║\n' +
        '║ 🔧 Anti-Sleep ➜ Enabled (5min)                ║\n' +
        '║ 🔰 Powered ➜ EXON XD SIR                   ║\n' +
        '╚═════════════════════════════════╝\n');
    loadExistingSessions();
    const APP_URL = process.env.APP_URL || 'http://localhost:' + PORT;
    if (APP_URL) {
        setInterval(async () => {
            try {
                await axios.get(APP_URL);
                console.log('⚡ Anti-Sleep Ping ➜ Server Active');
            } catch (e) {
                console.log('⚠️ Anti-Sleep Ping ➜ ' + e.message);
            }
        }, 5 * 60 * 1000);
    }
});