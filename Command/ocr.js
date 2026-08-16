const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { getTempDir, deleteTempFile } = require('../utils/tempManager');

module.exports = {
    name: "ocr",
    aliases: ["extracttext"],
    category: "tools",
    description: "Extract text from an image.",
    async execute(conn, m, { text, prefix }) {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        if (!/image/.test(mime)) {
            return await m.reply(`❌ Please reply to an image to extract text!\n\nExample: ${prefix}ocr (as a reply to an image)`);
        }

        await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        try {
            const media = await q.download();
            if (!media) throw new Error("Failed to download media");

            const tempDir = getTempDir();
            const tempFile = path.join(tempDir, `ocr_${Date.now()}.jpg`);
            fs.writeFileSync(tempFile, media);

            const form = new FormData();
            form.append('file', fs.createReadStream(tempFile));
            form.append('apikey', 'helloworld'); // Free demo key
            
            // Allow user to specify a 3-letter language code, e.g., ".ocr fre"
            const lang = text ? text.trim().substring(0, 3).toLowerCase() : 'eng';
            form.append('language', lang);

            const res = await axios.post('https://api.ocr.space/parse/image', form, {
                headers: form.getHeaders()
            });

            deleteTempFile(tempFile);

            if (res.data.IsErroredOnProcessing) {
                throw new Error(res.data.ErrorMessage[0] || "OCR API processing failed");
            }

            const parsedResults = res.data.ParsedResults;
            if (!parsedResults || parsedResults.length === 0) {
                 await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                 return await m.reply("❌ No text could be extracted from this image.");
            }

            const extractedText = parsedResults[0].ParsedText;
            if (!extractedText || extractedText.trim() === '') {
                 await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                 return await m.reply("❌ No text could be extracted from this image.");
            }

            await m.reply(`📄 *EXTRACTED TEXT*\n\n${extractedText}`);
            await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
        } catch (e) {
            console.error("OCR Error:", e);
            await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            await m.reply(`❌ Failed to extract text. Make sure the image is clear.\n\nDebug: ${e.message}`);
        }
    }
};

