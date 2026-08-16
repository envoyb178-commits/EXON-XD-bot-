const axios = require("axios");

module.exports = {
    name: "websiteclone",
    aliases: ["webclone", "clone", "web2zip"],
    category: "tools",
    desc: "Clone a website and download it as a ZIP file.",
    async execute(conn, m, { text, prefix }) {
        if (!text) {
            return await m.reply(`*Website Cloner (Web2Zip)*\n\nUsage: ${prefix}websiteclone <url>\nExample: ${prefix}websiteclone https://jerrycoder.vercel.app/`);
        }

        // Clean up the input string
        const cleanText = text.trim();

        // Strict URL Validation using Node's native URL constructor
        let targetUrl;
        try {
            targetUrl = new URL(cleanText);
            if (!["http:", "https:"].includes(targetUrl.protocol)) {
                throw new Error("Invalid protocol");
            }
        } catch {
            return await m.reply("❌ Please provide a valid URL starting with http:// or https://");
        }

        // Send initial processing reaction
        await conn.sendMessage(m.chat, { react: { text: "🌐", key: m.key } });

        try {
            const apiUrl = `https://webclonerapi.vercel.app/api/clone?url=${encodeURIComponent(targetUrl.href)}`;
            
            // Added a 30-second timeout since cloning large sites can take time
            const response = await axios.get(apiUrl, { timeout: 30000 });
            const data = response.data;

            // Handle API errors even if the HTTP status was 200
            if (!data || data.status !== "success" || !data.download) {
                await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                return await m.reply(`Error: ${data?.message || "Failed to clone website. It might be too large or protected."}`);
            }

            const downloadUrl = data.download;
            const domain = targetUrl.hostname;
            const fileName = `${domain}_cloned.zip`;

            // Deliver the file payload
            await conn.sendMessage(m.chat, {
                document: { url: downloadUrl },
                mimetype: 'application/zip',
                fileName: fileName,
                caption: `*DONE CLONED EXON  XD*\n\n*URL:* ${targetUrl.href}\n*Filename:* ${fileName}\n\n> _EXON ＸＤ_`
            }, { quoted: m });

            // Success reaction
            await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

        } catch (e) {
            // Detailed console logging for debugging
            console.error("Website Clone Error:", e?.response?.data || e.message);
            
            // Send error feedback to the user
            await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            
            if (e.code === 'ECONNABORTED') {
                await m.reply("error");
            } else {
                await m.reply("sorry error busy");
            }
        }
    }
};