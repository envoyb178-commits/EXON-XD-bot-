// commands/tempmail.js
const axios = require('axios');

module.exports = async function(sock, message, args) {
    const chatId = message.key.remoteJid;
    const action = args[0]?.toLowerCase();
    const emailArg = args[1];

    if (!action || (action !== 'gen' && action !== 'inbox')) {
        return await sock.sendMessage(chatId, {
            text: `📧 *Temp Mail Menu*\n\n` +
                `1. Generate email: \`.tempmail gen\`\n` +
                `2. Check inbox: \`.tempmail inbox [email]\``
        }, { quoted: message });
    }

    // React with hourglass
    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

    try {
        if (action === 'gen') {
            const res = await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1');
            const email = res.data[0];
            await sock.sendMessage(chatId, {
                text: `📧 *Temporary Email Generated*\n\n\`${email}\`\n\n` +
                    `Use \`.tempmail inbox ${email}\` to check for new messages.`
            }, { quoted: message });
        } else if (action === 'inbox') {
            const email = emailArg;
            if (!email || !email.includes('@')) {
                return await sock.sendMessage(chatId, {
                    text: "❌ Please provide the email address you generated.\nExample: `.tempmail inbox example@1secmail.com`"
                }, { quoted: message });
            }
            const [login, domain] = email.split('@');
            const res = await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);

            if (res.data.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `📭 Inbox is empty for ${email}`
                }, { quoted: message });
            } else {
                let msgList = `📬 *Inbox for ${email}*\n\n`;
                const msgs = res.data.slice(0, 5);
                for (const msg of msgs) {
                    msgList += `*From:* ${msg.from}\n*Subject:* ${msg.subject}\n*Date:* ${msg.date}\n\n`;
                }
                if (res.data.length > 5) {
                    msgList += `_Showing up to 5 latest messages._`;
                }
                await sock.sendMessage(chatId, { text: msgList }, { quoted: message });
            }
        }
        // Success reaction
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('TempMail error:', e);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: "❌ Failed to access tempmail service. Please try again later."
        }, { quoted: message });
    }
};