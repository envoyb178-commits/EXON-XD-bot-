const axios = require('axios');
const mimeTypes = require('mime-types');

module.exports = {
    name: "url",
    aliases: ["tourl", "upload", "cdn", "telegraph", "imgbb"],
    category: "tools",
    description: "Convert any media/file to a direct URL using ImgBB (Images) or Telegraph (Others).",
    async execute(conn, m, { args, prefix, config }) {
        let q = m.quoted ? m.quoted : m;
        let msg = q.msg || q;
        let mime = msg.mimetype || '';

        let text = m.text || (m.quoted ? m.quoted.text : '');
        let urlMatch = text.match(/https?:\/\/[^\s]+/);

        let ext = 'txt';
        let content = '';
        let hasCustomExt = false;

        if (m.quoted && m.quoted.text) {
            content = m.quoted.text;
            if (args && args[0]) {
                let firstArg = args[0].toLowerCase();
                let hasDot = firstArg.startsWith('.');
                let cleanExt = firstArg.replace(/^\./, '');
                let isKnown = mimeTypes.lookup(cleanExt);
                if (hasDot || isKnown) {
                    ext = cleanExt;
                    hasCustomExt = true;
                }
            }
        } else if (args && args.length > 0) {
            let firstArg = args[0].toLowerCase();
            let hasDot = firstArg.startsWith('.');
            let cleanExt = firstArg.replace(/^\./, '');
            let isKnown = mimeTypes.lookup(cleanExt);
            
            if (args.length >= 2 && (hasDot || isKnown)) {
                ext = cleanExt;
                content = args.slice(1).join(' ');
                hasCustomExt = true;
            } else {
                ext = 'txt';
                content = args.join(' ');
            }
        }

        // We check urlMatch only if there is no custom extension specified (to allow uploading URLs as text)
        let finalUrlMatch = hasCustomExt ? null : urlMatch;

        if (!mime && !q.download && !finalUrlMatch && !content) {
            return await m.reply(`Please reply to any media\n\nExample: ${prefix}url (reply to media/text)\nExample: ${prefix}url html <h1>Hi</h1>\nExample: ${prefix}url hello world\nExample: ${prefix}url https://example.com/image.png`);
        }

        await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
        let pMsg = await conn.sendMessage(m.chat, { text: "Uploading..." }, { quoted: m });

        try {
            let directUrl = '';
            let fileSize = 0;
            let buffer = null;
            let filename = '';
            let contentType = '';

            if (mime) {
                // Media upload
                buffer = await q.download();
                if (!buffer) throw new Error("Failed to download media.");
                filename = `xeno_${Date.now()}.${mime.split('/')[1] || 'file'}`;
                contentType = mime;
            } else if (content) {
                // Text/code upload
                buffer = Buffer.from(content, 'utf-8');
                filename = `xeno_${Date.now()}.${ext}`;
                contentType = mimeTypes.lookup(ext) || 'text/plain';
            }

            if (buffer) {
                fileSize = buffer.length;
                const FormData = require('form-data');
                const formData = new FormData();
                
                formData.append('file', buffer, {
                    filename,
                    contentType
                });

                const response = await axios.post('https://xenocdn.xenocdn.workers.dev/upload', formData, {
                    headers: { ...formData.getHeaders() },
                    timeout: 60000
                });

                const data = response.data;
                if (data.status === 'success' && data.url) {
                    directUrl = data.url;
                } else if (typeof data === 'string') {
                    directUrl = data;
                } else {
                    throw new Error(data.error || "Failed");
                }
            } else if (finalUrlMatch) {
                // Upload via URL
                const targetUrl = finalUrlMatch[0];
                const response = await axios.get(`https://xenocdn.xenocdn.workers.dev/upload?url=${encodeURIComponent(targetUrl)}`);
                const data = response.data;
                
                if (data.status === 'success' && data.url) {
                    directUrl = data.url;
                    fileSize = data.size || 0;
                } else {
                    throw new Error(data.error || "Failed");
                }
            }

            if (directUrl) {
                await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
                await conn.sendMessage(m.chat, { text: directUrl, edit: pMsg.key });
            }

        } catch (e) {
            console.error("URL conversion error:", e);
            await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            await conn.sendMessage(m.chat, { text: `*UPLOAD FAILED*\n\nReason: ${e.message || "Unknown error"}`, edit: pMsg.key });
        }
    }
};
