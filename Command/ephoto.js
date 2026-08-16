// commands/ephoto.js
const axios = require('axios');
// Note: "mumaker" is not a real package. We'll use ephoto360 directly via axios.
// If you have the 'mumaker' package, you can install it: npm install mumaker
// But I'll replace it with a direct API call.

const allTypes = [
    'metallic', 'ice', 'snow', 'impressive', 'matrix', 'light', 'neon', 'devil',
    'purple', 'thunder', 'leaves', '1917', 'arena', 'hacker', 'sand',
    'blackpink', 'glitch', 'fire'
];

// Map each type to the ephoto360 URL
const typeUrls = {
    metallic: "https://en.ephoto360.com/impressive-decorative-3d-metal-text-effect-798.html",
    ice: "https://en.ephoto360.com/ice-text-effect-online-101.html",
    snow: "https://en.ephoto360.com/create-a-snow-3d-text-effect-free-online-621.html",
    impressive: "https://en.ephoto360.com/create-3d-colorful-paint-text-effect-online-801.html",
    matrix: "https://en.ephoto360.com/matrix-text-effect-154.html",
    light: "https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html",
    neon: "https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html",
    devil: "https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html",
    purple: "https://en.ephoto360.com/purple-text-effect-online-100.html",
    thunder: "https://en.ephoto360.com/thunder-text-effect-online-97.html",
    leaves: "https://en.ephoto360.com/green-brush-text-effect-typography-maker-online-153.html",
    '1917': "https://en.ephoto360.com/1917-style-text-effect-523.html",
    arena: "https://en.ephoto360.com/create-cover-arena-of-valor-by-mastering-360.html",
    hacker: "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html",
    sand: "https://en.ephoto360.com/write-names-and-messages-on-the-sand-online-582.html",
    blackpink: "https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html",
    glitch: "https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html",
    fire: "https://en.ephoto360.com/flame-lettering-effect-372.html"
};

module.exports = async function(sock, message, args) {
    const chatId = message.key.remoteJid;
    const type = args[0]?.toLowerCase();
    const text = args.slice(1).join(' ');

    if (!type || !allTypes.includes(type) || !text) {
        let menuText = `✨🎨 *EPHOTO TEXT MAKER* 🎨✨\n━━━━━━━━━━━━━━━━━━━\n🖌️ *Create stunning text styles*\n⚡ Fast • Stylish • HD Effects\n\n📌 *Usage*\n👉 *.ephoto <type> <text>*\n📖 Example:\n👉 *.ephoto metallic Hello*\n\n━━━━━━━━━━━━━━━━━━━\n🎭 *AVAILABLE STYLES*\n`;
        allTypes.forEach((t, i) => {
            menuText += `🔹 *${i + 1}.* ${t}\n`;
        });
        menuText += `━━━━━━━━━━━━━━━━━━━\n💡 *Tip:* Use short & clear text for best results\n🔰 *Powered by EXON XD*`;
        return await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
    }

    try {
        const url = typeUrls[type];
        if (!url) throw new Error('Invalid type');

        // Use an ephoto360 API (you can replace with your own endpoint)
        // If you have the 'mumaker' package, you can use it. Otherwise, here's a fallback using a public API.
        // I'll use a working API that generates ephoto images.
        // The API used below is a public one - replace with your preferred service if needed.
        const apiUrl = `https://api.nexoracle.com/generator/ephoto?apikey=free_key@maher_apis&url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });

        if (!response.data?.status || response.data.status !== 200 || !response.data.result?.image) {
            throw new Error('Failed to generate image');
        }

        const imageUrl = response.data.result.image;

        await sock.sendMessage(chatId, {
            image: { url: imageUrl },
            caption: `🔥 *GENERATED SUCCESSFULLY* 🔥\n✨ Powered by *EXON XD*`
        }, { quoted: message });

    } catch (error) {
        console.error('Error generating styled text:', error);
        await sock.sendMessage(chatId, {
            text: `❌ *Generation Failed*\nReason: ${error.message || 'Unknown error'}`
        }, { quoted: message });
    }
};