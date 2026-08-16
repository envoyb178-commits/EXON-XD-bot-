// commands/websiteclone.js
const axios = require('axios');

module.exports = async function(sock, message, args) {
    const chatId = message.key.remoteJid;
    const text = args.join(' ').trim();

    if (!text) {
        return await sock.sendMessage(chatId, {
            text: `*Website Cloner (Web2Zip)*\n\nUsage: .websiteclone <url>\nExample: .websiteclone https://example.com`
        }, { quoted: message });
    }

    // Validate URL
    let targetUrl;
    try {
        targetUrl = new URL(text);
        if (!["http:", "https:"].includes(targetUrl.protocol)) {
            throw new Error("Invalid protocol");
        }
    } catch {
        return await sock.sendMessage(chatId, {
            text: "❌ Please provide a valid URL starting with http:// or https://"
        }, { quoted: message });
    }

    // React with globe
    await sock.sendMessage(chatId, { react: { text: '🌐', key: message.key } });

    try {
        const apiUrl = `https://webclonerapi.vercel.app/api/clone?url=${encodeURIComponent(targetUrl.href)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const data = response.data;

        if (!data || data.status !== "success" || !data.download) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, {
                text: `❌ ${data?.message || "Failed to clone website. It might be too large or protected."}`
            }, { quoted: message });
        }

        const downloadUrl = data.download;
        const domain = targetUrl.hostname;
        const fileName = `${domain}_cloned.zip`;

        await sock.sendMessage(chatId, {
            document: { url: downloadUrl },
            mimetype: 'application/zip',
            fileName: fileName,
            caption: `✅ *Website Cloned Successfully*\n\n🌐 URL: ${targetUrl.href}\n📦 File: ${fileName}\n\n🔰 *Powered by EXON XD*`
        }, { quoted: message });

        // Success reaction
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (e) {
        console.error("Website Clone Error:", e?.response?.data || e.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });

        let errorMsg = "❌ Failed to clone the website.";
        if (e.code === 'ECONNABORTED') {
            errorMsg = "⏱️ Cloning timed out. The website might be too large.";
        } else if (e.response) {
            errorMsg = `❌ Server error: ${e.response.status}`;
        }
        await sock.sendMessage(chatId, { text: errorMsg }, { quoted: message });
    }
};