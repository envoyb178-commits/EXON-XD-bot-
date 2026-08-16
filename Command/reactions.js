// commands/reactions.js
const axios = require('axios');

const REACTION_LIST = [
    'bite', 'blush', 'bonk', 'bully', 'cringe', 'cry', 'cuddle',
    'dance', 'glomp', 'handhold', 'happy', 'highfive', 'hug',
    'kick', 'kill', 'kiss', 'lick', 'nom', 'pat', 'poke',
    'slap', 'smile', 'smug', 'wave', 'wink', 'yeet'
];

const VERB_MAP = {
    bite: 'bites',
    blush: 'blushes at',
    bonk: 'bonks',
    bully: 'bullies',
    cringe: 'cringes at',
    cry: 'cries in front of',
    cuddle: 'cuddles',
    dance: 'dances with',
    glomp: 'glomps',
    handhold: 'holds hands with',
    happy: 'is happy with',
    highfive: 'high-fives',
    hug: 'hugs',
    kick: 'kicks',
    kill: 'kills',
    kiss: 'kisses',
    lick: 'licks',
    nom: 'noms with',
    pat: 'pats',
    poke: 'pokes',
    slap: 'slaps',
    smile: 'smiles at',
    smug: 'smugs at',
    wave: 'waves at',
    wink: 'winks at',
    yeet: 'yeets'
};

module.exports = async function(sock, message, args, commandName) {
    const chatId = message.key.remoteJid;

    // If the command is 'reaction' or 'reactions' with no specific reaction, show the list
    if (commandName === 'reaction' || commandName === 'reactions') {
        const list = REACTION_LIST.map(r => `• ${r}`).join('\n');
        return await sock.sendMessage(chatId, {
            text: `🎭 *Available Reactions*\n\n${list}\n\nUsage: .<reaction> [@user] or reply to a message\nExample: .hug @user`
        }, { quoted: message });
    }

    const reaction = commandName;
    if (!REACTION_LIST.includes(reaction)) {
        return await sock.sendMessage(chatId, {
            text: `❌ Unknown reaction: ${reaction}\nUse .reaction to see all available.`
        }, { quoted: message });
    }

    try {
        // React with a mask emoji while processing
        await sock.sendMessage(chatId, { react: { text: '🎭', key: message.key } });

        // Get mentioned users (tags) or quoted sender
        let users = [];
        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length > 0) users.push(...mentioned);

        if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedSender = message.message.extendedTextMessage.contextInfo.participant;
            if (quotedSender && !users.includes(quotedSender)) users.push(quotedSender);
        }

        // If no one is mentioned, default to the sender themselves
        if (users.length === 0) users.push(message.key.participant || message.key.remoteJid);

        const target = users[0];
        const isSelf = target === (message.key.participant || message.key.remoteJid);

        // Fetch GIF from waifu.pics
        const { data: gifData } = await axios.get(`https://api.waifu.pics/sfw/${reaction}`, { timeout: 10000 });
        if (!gifData?.url) throw new Error('No GIF URL');

        // Download the GIF as buffer
        const { data: gifBuffer } = await axios.get(gifData.url, {
            responseType: 'arraybuffer',
            timeout: 15000
        });

        // Prepare caption
        const senderName = message.pushName || message.key.remoteJid.split('@')[0];
        const targetName = isSelf ? 'themselves' : `@${target.split('@')[0]}`;
        const caption = `*${senderName} ${VERB_MAP[reaction] || reaction} ${targetName}*`;

        // Send as video with GIF playback
        await sock.sendMessage(chatId, {
            video: Buffer.from(gifBuffer),
            gifPlayback: true,
            caption: caption,
            mentions: [message.key.participant || message.key.remoteJid, target]
        }, { quoted: message });

    } catch (error) {
        console.error('Reaction error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to fetch reaction GIF. Please try again later.'
        }, { quoted: message });
    }
};