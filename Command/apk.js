// commands/apk.js
const axios = require('axios');

module.exports = async function(sock, message, args) {
    const chatId = message.key.remoteJid;
    const query = args.join(' ').trim();

    if (!query) {
        return await sock.sendMessage(chatId, {
            text: '⚠️ *Please provide an app name.*\nExample: `.apk whatsapp`'
        }, { quoted: message });
    }

    try {
        // React with hourglass
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // Use NexOracle API (free key)
        const apiUrl = 'https://api.nexoracle.com/downloader/apk';
        const params = {
            apikey: 'free_key@maher_apis',
            q: query
        };

        const response = await axios.get(apiUrl, { params });
        if (!response.data || response.data.status !== 200 || !response.data.result) {
            throw new Error('No APK found');
        }

        const { name, lastup, package: pkg, size, icon, dllink } = response.data.result;

        // Send thumbnail preview
        await sock.sendMessage(chatId, {
            image: { url: icon },
            caption: `📦 *Downloading ${name}... Please wait.*`
        }, { quoted: message });

        // Download APK
        const apkRes = await axios.get(dllink, { responseType: 'arraybuffer' });
        if (!apkRes.data) throw new Error('Download failed');

        const apkBuffer = Buffer.from(apkRes.data, 'binary');
        const details = `📦 *APK Details*\n\n` +
            `🔖 *Name*: ${name}\n` +
            `📅 *Last Update*: ${lastup}\n` +
            `📦 *Package*: ${pkg}\n` +
            `📏 *Size*: ${size}\n\n` +
            `🔰 *Powered by EXON XD*`;

        // Send APK as document
        await sock.sendMessage(chatId, {
            document: apkBuffer,
            mimetype: 'application/vnd.android.package-archive',
            fileName: `${name}.apk`,
            caption: details
        }, { quoted: message });

        // Success reaction
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('APK error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to fetch APK. Please try again later.'
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
};