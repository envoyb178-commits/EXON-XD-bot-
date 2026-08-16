// commands/stext.js

// --- Unicode style transformers ---
const styleMap = {
    bold: {
        map: (c) => {
            const A = '𝐀', a = '𝐚';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D400 - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D41A - 97);
            return c;
        }
    },
    italic: {
        map: (c) => {
            const A = '𝐴', a = '𝑎';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D434 - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D44E - 97);
            return c;
        }
    },
    boldItalic: {
        map: (c) => {
            const A = '𝑨', a = '𝒂';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D468 - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D482 - 97);
            return c;
        }
    },
    script: {
        map: (c) => {
            const A = '𝒜', a = '𝒶';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D49C - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D4B6 - 97);
            return c;
        }
    },
    boldScript: {
        map: (c) => {
            const A = '𝓐', a = '𝓪';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D4D0 - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D4EA - 97);
            return c;
        }
    },
    fraktur: {
        map: (c) => {
            const A = '𝔄', a = '𝔞';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D504 - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D51E - 97);
            return c;
        }
    },
    boldFraktur: {
        map: (c) => {
            const A = '𝕬', a = '𝖆';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D56C - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D586 - 97);
            return c;
        }
    },
    doubleStruck: {
        map: (c) => {
            const A = '𝔸', a = '𝕒';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D538 - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D552 - 97);
            return c;
        }
    },
    monospace: {
        map: (c) => {
            const A = '𝙰', a = '𝚊';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D670 - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D68A - 97);
            return c;
        }
    },
    sans: {
        map: (c) => {
            const A = '𝖠', a = '𝖺';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D5A0 - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D5BA - 97);
            return c;
        }
    },
    sansBold: {
        map: (c) => {
            const A = '𝗔', a = '𝗮';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D5D4 - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D5EE - 97);
            return c;
        }
    },
    sansItalic: {
        map: (c) => {
            const A = '𝘈', a = '𝘢';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D608 - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D622 - 97);
            return c;
        }
    },
    sansBoldItalic: {
        map: (c) => {
            const A = '𝘼', a = '𝙖';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D63C - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D656 - 97);
            return c;
        }
    },
    circle: {
        map: (c) => {
            const A = 'Ⓐ', a = 'ⓐ';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x24B6 - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x24D0 - 97);
            return c;
        }
    },
    parenthesized: {
        map: (c) => {
            const A = '🄐', a = '⒜';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1F110 - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x249C - 97);
            return c;
        }
    }
};

const styleNames = Object.keys(styleMap);

module.exports = async function(sock, message, args) {
    const chatId = message.key.remoteJid;
    const text = args.join(' ');

    if (!text || text.trim() === '') {
        return await sock.sendMessage(chatId, {
            text: "*Please provide a text to style.*\nExample: .stext Hello"
        }, { quoted: message });
    }

    try {
        // Generate all styles
        const results = styleNames.map(style => {
            const transform = styleMap[style];
            const styled = text.split('').map(c => transform.map(c)).join('');
            return { style, result: styled };
        });

        // Build menu message
        let menuText = `*🎨 Fancy Text Styles*\n\n`;
        results.forEach((item, i) => {
            menuText += `${i + 1}. ${item.result}\n`;
        });
        menuText += `\n_Reply with the number of your choice._`;

        const sentMsg = await sock.sendMessage(chatId, { text: menuText }, { quoted: message });

        // Setup listener for reply
        const listener = async ({ messages }) => {
            const m = messages[0];
            if (!m.message || !m.key || m.key.remoteJid !== chatId) return;

            // Check if it's a reply to our message
            const ctx = m.message?.extendedTextMessage?.contextInfo || {};
            const quotedId = ctx.stanzaId || ctx.quotedMessageKey?.id;
            if (quotedId !== sentMsg.key.id) return;

            const replyText = m.message.conversation || m.message.extendedTextMessage?.text || '';
            const choice = parseInt(replyText.trim(), 10);
            if (isNaN(choice) || choice < 1 || choice > results.length) {
                await sock.sendMessage(chatId, {
                    text: `❌ Invalid choice. Please choose a number between 1 and ${results.length}.`
                }, { quoted: m });
                return;
            }

            const selected = results[choice - 1];
            await sock.sendMessage(chatId, {
                text: `*${selected.style}*\n${selected.result}`
            }, { quoted: m });

            // Clean up listener
            sock.ev.off('messages.upsert', listener);
        };

        sock.ev.on('messages.upsert', listener);

        // Timeout cleanup after 2 minutes
        setTimeout(() => {
            sock.ev.off('messages.upsert', listener);
        }, 120000);

    } catch (error) {
        console.error('Style text error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to style the text. Please try again later.'
        }, { quoted: message });
    }
};