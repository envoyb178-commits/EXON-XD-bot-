const mumaker = require('mumaker');
const config = require('../config');

// Helper to create a logo command object
const createLogoCommand = (name, url, type = 'ephoto', example = 'EXON') => {
  return {
    name: name,
    aliases: [],
    category: 'logo',
    description: `Create a ${name} style logo`,
    usage: `.${name} ${name === 'pornhub' ? 'TEXT1;TEXT2' : 'TEXT'}`,
    
    async execute(conn, m, { text, prefix }) {
      try {
        if (!text) {
          return await m.reply(`Usage: ${prefix}${name} ${name === 'pornhub' ? 'EXON;HUB' : 'EXON'}`);
        }
        
        await conn.sendMessage(m.chat, { react: { text: "🎨", key: m.key } });
        
        // Support multiple texts separated by ;
        const input = text.includes(';') ? text.split(';').map(t => t.trim()) : text;
        
        let result;
        if (type === 'ephoto') {
          result = await mumaker.ephoto(url, input);
        } else if (type === 'photooxy') {
          result = await mumaker.photooxy(url, input);
        }
        
        if (!result || !result.image) {
          throw new Error('No image URL received from the API');
        }
        
        await conn.sendMessage(m.chat, {
          image: { url: result.image },
          caption: `✅ ${name.charAt(0).toUpperCase() + name.slice(1)} logo generated!\n\n_Powered by ${config.botName}_`
        }, { quoted: m });
        
        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

      } catch (error) {
        console.error(`Error in ${name} command:`, error);
        // More human-friendly error messages
        let msg = error.message;
        if (msg.includes('is not valid JSON')) msg = "Website is temporarily unavailable. Try again later.";
        if (msg.includes('Cannot read properties of undefined')) msg = "Failed to process the request. Try another word.";
        
        await m.reply(`❌ Error: ${msg}`);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      }
    }
  };
};

// ONLY Working Logo Effects confirmed by benchmark
const workingLogos = [
  { name: 'blackpink', url: 'https://en.ephoto360.com/create-blackpink-logo-online-free-607.html' },
  { name: 'harrypotter', url: 'https://en.ephoto360.com/create-harry-potter-text-effect-online-free-102.html' },
  { name: 'matrix', url: 'https://en.ephoto360.com/matrix-text-effect-style-online-712.html' },
  { name: 'gradient', url: 'https://en.ephoto360.com/create-neon-gradient-text-effects-online-711.html' },
  { name: 'glitch', url: 'https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html' },
  { name: 'pornhub', url: 'https://en.ephoto360.com/create-pornhub-style-logos-online-free-549.html' },
];

module.exports = workingLogos.map(eff => createLogoCommand(eff.name, eff.url, eff.type));
