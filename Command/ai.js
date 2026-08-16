const axios = require("axios");

module.exports = {
    name: "gemini",
    aliases: ["chatai", "ai", "gpt"],
    category: "ai",
    async execute(conn, m, { text, prefix }) {
        if (!text) {
            return await m.reply(`Please provide a prompt.\nExample: ${prefix}gemini What is the capital of France?`);
        }

        await m.reply("_THINKING...._");

        try {
            const apiUrl = `https://xenochatgpt.vercel.app/api/chatgpt?prompt=${encodeURIComponent(text)}`;
            
            const { data } = await axios.get(apiUrl);

            const responseText = typeof data === "object" ? (data.result || data.response || JSON.stringify(data)) : data;

            if (!responseText) {
                return await m.reply("_SERVER BUSY_");
            }

            await m.reply(responseText.trim());

        } catch (e) {
            console.error("BUSY..", e?.response?.data || e.message);
            await m.reply("TRY LATER");
        }
    }
};