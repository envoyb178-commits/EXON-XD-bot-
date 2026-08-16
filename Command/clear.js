// commands/clear.js
module.exports = async function(sock, message, args) {
    const chatId = message.key.remoteJid;

    try {
        // Send a temporary message
        const sent = await sock.sendMessage(chatId, {
            text: '🧹 Clearing bot messages...'
        }, { quoted: message });

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Delete the temporary message
        await sock.sendMessage(chatId, { delete: sent.key });

    } catch (error) {
        console.error('Error clearing messages:', error);
        await sock.sendMessage(chatId, {
            text: '❌ An error occurred while clearing messages.'
        }, { quoted: message });
    }
};