import axios from 'axios';

export const name = 'textpro';
export const command = ['blackpink', 'neon', 'glitch', 'thunder'];

export const handler = async (sock, msg, args, { from }) => {
  const text = args.join(' ');
  if (!text) return sock.sendMessage(from, { text: 'Usage: blackpink <text>' });

  const apis = {
    blackpink: `https://textpro.me/api/textpro/blackpink-logo-style-text-effect-online-1003.html?text=${encodeURIComponent(text)}`,
    neon: `https://textpro.me/api/textpro/neon-light-text-effect-online-882.html?text=${encodeURIComponent(text)}`,
    glitch: `https://textpro.me/api/textpro/create-glitch-text-effect-style-tik-tok-983.html?text=${encodeURIComponent(text)}`,
    thunder: `https://textpro.me/api/textpro/thunder-text-effect-online-881.html?text=${encodeURIComponent(text)}`
  };

  try {
    const res = await axios.get(apis[msg.command]);
    const url = res.data.image || res.data.url;
    await sock.sendMessage(from, { image: { url }, caption: msg.command });
  } catch {
    await sock.sendMessage(from, { text: 'Failed to generate text effect' });
  }
};