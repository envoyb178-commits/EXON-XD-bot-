
const { wallpaper } = require('../System/Scrapers.js'); 

// Constants – set your own or use env
const TENOR_API_KEY = process.env.TENOR_API_KEY || 'AIzaSyC1u7ZvB51Pu-1C0e6wqWzQw8rBw8j5H6Q'; // placeholder, replace with yours
const PACKNAME = process.env.PACKNAME || 'EXON XD';
const BOT_NAME = process.env.BOT_NAME || 'EXON XD';

// List of all commands this module handles
const SEARCH_COMMANDS = [
    'google', 'search', 'lyrics', 'yts', 'youtubesearch',
    'stickersearch', 'getsticker', 'github', 'gh', 'wallpaper', 'wall',
    'wikipedia', 'wiki'
];

module.exports = async function(sock, message, args, commandName) {
    const chatId = message.key.remoteJid;
    const text = args.join(' ').trim();
    const prefix = '.';
    const pushName = message.pushName || 'User';

    // Helper to send a reaction
    const doReact = async (emoji) => {
        try {
            await sock.sendMessage(chatId, { react: { text: emoji, key: message.key } });
        } catch (e) {}
    };

    // ---- COMMAND SWITCH ----
    switch (commandName) {
        case 'google':
        case 'search':
            if (!text) {
                await doReact('❔');
                return await sock.sendMessage(chatId, {
                    text: `Please provide an image Search Term!\nExample: *${prefix}search Free Web development Course*`
                }, { quoted: message });
            }
            await doReact('🔍');
            try {
                const googleSearch = await searchit(text, 10);
                if (!googleSearch || googleSearch.length === 0) {
                    await doReact('❌');
                    return await sock.sendMessage(chatId, {
                        text: `No results found for: *${text}*`
                    }, { quoted: message });
                }
                let resText = `  *『  ⚡️ Google Search Engine ⚡️  』*\n\n\n_🔍 Search Term:_ *${text}*\n\n\n`;
                for (const result of googleSearch) {
                    resText += `_📍 Result:_ *${result.index + 1}*\n\n_🎀 Title:_ *${result.page}*\n\n_🔶 Description:_ *${result.desc}*\n\n_🔷 Link:_ *${result.url}*\n\n\n`;
                }
                await sock.sendMessage(chatId, {
                    video: { url: 'https://media.tenor.com/3aaAzbTrTMwAAAPo/google-technology-company.mp4' },
                    gifPlayback: true,
                    caption: resText
                }, { quoted: message });
            } catch (err) {
                console.error('Search error:', err);
                await doReact('❌');
                return await sock.sendMessage(chatId, {
                    text: `An error occurred while searching for: *${text}*`
                }, { quoted: message });
            }
            break;

        case 'lyrics':
            if (!text) {
                await doReact('❔');
                return await sock.sendMessage(chatId, {
                    text: `Please provide a lyrics Search Term!\nExample: *${prefix}lyrics Heat waves*`
                }, { quoted: message });
            }
            await doReact('📃');
            await sock.sendPresenceUpdate('composing', chatId);
            try {
                let result = await getLyrics(text);
                if (result && result.status !== 500 && result.lyrics && result.thumbnail) {
                    let resText2 = `  *『  ⚡️ Lyrics Search Engine ⚡️  』*\n\n\n_Search Term:_ *${text}*\n\n\n*📍 Lyrics:* \n\n${result.lyrics}\n\n\n_*Powered by:*_ *Lyrics Scraper - by FantoX*\n\n_*Url:*_ https://github.com/FantoX/lyrics-scraper`;
                    await sock.sendMessage(chatId, {
                        image: { url: result.thumbnail },
                        caption: resText2
                    }, { quoted: message });
                } else {
                    await doReact('❌');
                    return await sock.sendMessage(chatId, {
                        text: result?.message || `Unable to find lyrics for the song: *${text}*`
                    }, { quoted: message });
                }
            } catch (err) {
                console.error('Lyrics Error:', err);
                await doReact('❌');
                return await sock.sendMessage(chatId, {
                    text: `An error occurred while fetching lyrics for: *${text}*`
                }, { quoted: message });
            }
            break;

        case 'yts':
        case 'youtubesearch':
            if (!text) {
                await doReact('❔');
                return await sock.sendMessage(chatId, {
                    text: `Please provide a YouTube Search Term!\nExample: *${prefix}yts Despacito*`
                }, { quoted: message });
            }
            await doReact('📜');
            let search = await yts(text);
            let thumbnail2 = search.all[0].thumbnail;
            let num = 1;
            let txt2 = `*🏮 YouTube Search Engine 🏮*\n\n_🧩 Search Term:_ *${text}*\n\n*📌 Total Results:* *${search.all.length}*\n`;
            for (let i of search.all) {
                txt2 += `\n_Result:_ *${num++}*\n_🎀 Title:_ *${i.title}*\n_🔶 Duration:_ *${i.timestamp}*\n_🔷 Link:_ ${i.url}\n\n`;
            }
            await sock.sendMessage(chatId, {
                image: { url: thumbnail2 },
                caption: txt2
            }, { quoted: message });
            break;

        case 'stickersearch':
        case 'getsticker':
            if (!text) {
                await doReact('❔');
                return await sock.sendMessage(chatId, {
                    text: `Please provide a sticker Search Term!\n\n*${prefix}stickersearch Cheems bonk*`
                }, { quoted: message });
            }
            await doReact('🧧');
            let gif = await axios.get(
                `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(text)}&key=${TENOR_API_KEY}&client_key=my_project&limit=8&media_filter=gif`
            );
            let resultst = Math.floor(Math.random() * 8);
            let gifUrl = gif.data.results[resultst].media_formats.gif.url;

            let response = await axios.get(gifUrl, { responseType: 'arraybuffer' });
            let buffer = Buffer.from(response.data, 'utf-8');

            let stickerMess = new Sticker(buffer, {
                pack: PACKNAME,
                author: pushName,
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 60,
                background: 'transparent'
            });
            let stickerBuffer2 = await stickerMess.toBuffer();
            await sock.sendMessage(chatId, { sticker: stickerBuffer2 }, { quoted: message });
            break;

        case 'gh':
        case 'github':
            if (!text) {
                await doReact('❔');
                return await sock.sendMessage(chatId, {
                    text: `Please provide a valid *Github* username!\nExample: *${prefix}gh FantoX001*`
                }, { quoted: message });
            }
            await doReact('📊');
            let GHuserInfo;
            try {
                const ghRes = await axios.get(`https://api.github.com/users/${text}`);
                GHuserInfo = ghRes.data;
            } catch (error) {
                await doReact('❌');
                return await sock.sendMessage(chatId, {
                    text: `GitHub user not found or API error: ${error.message}`
                }, { quoted: message });
            }
            const GhUserPP = GHuserInfo.avatar_url;
            let resText4 = `        *🏮 GitHub User Info 🏮*\n\n_🎀 Username:_ *${GHuserInfo.login}*\n_🧩 Name:_ *${GHuserInfo.name}*\n\n_🧣 Bio:_ *${GHuserInfo.bio}*\n\n_🍁 Total Followers:_ *${GHuserInfo.followers}*\n_🔖 Total Public Repos:_ *${GHuserInfo.public_repos}*\n_📌 Website:_ ${GHuserInfo.blog}\n`;
            await sock.sendMessage(chatId, {
                image: { url: GhUserPP, mimetype: 'image/jpeg' },
                caption: resText4
            }, { quoted: message });
            break;

        case 'wallpaper':
        case 'wall':
            if (!text) {
                await doReact('❔');
                return await sock.sendMessage(chatId, {
                    text: `Please provide a wallpaper search term!\nExample: *${prefix}wallpaper nature*`
                }, { quoted: message });
            }
            await doReact('🖼️');
            try {
                const results = await wallpaper(text);
                if (!results || !results.length) {
                    await doReact('❌');
                    return await sock.sendMessage(chatId, {
                        text: `No wallpapers found for: *${text}*`
                    }, { quoted: message });
                }
                const picked = results[Math.floor(Math.random() * Math.min(results.length, 10))];
                const imgUrl = picked.image[0] || picked.image[1] || picked.image[2];
                if (!imgUrl) {
                    await doReact('❌');
                    return await sock.sendMessage(chatId, {
                        text: `No wallpapers found for: *${text}*`
                    }, { quoted: message });
                }
                const caption = `🖼️ *${picked.title || text}*\n_Type:_ ${picked.type || 'Wallpaper'}\n\n_🧩 Powered by_ *${BOT_NAME}*`;
                await sock.sendMessage(chatId, {
                    image: { url: imgUrl },
                    caption
                }, { quoted: message });
            } catch (err) {
                console.error('[ WALLPAPER ] Error:', err.message);
                await doReact('❌');
                await sock.sendMessage(chatId, {
                    text: `Wallpaper search failed: ${err.message}`
                }, { quoted: message });
            }
            break;

        case 'wikipedia':
        case 'wiki':
            if (!text) {
                await doReact('❔');
                return await sock.sendMessage(chatId, {
                    text: `Please provide a search term!\nExample: *${prefix}wiki Elon Musk*`
                }, { quoted: message });
            }
            await doReact('📖');
            try {
                const searchRes = await axios.get(
                    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`,
                    {
                        timeout: 10000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' }
                    }
                );
                const { title, extract, thumbnail, content_urls } = searchRes.data;
                if (!extract) {
                    await doReact('❌');
                    return await sock.sendMessage(chatId, {
                        text: `No Wikipedia article found for: *${text}*`
                    }, { quoted: message });
                }
                const summary = extract.length > 800 ? extract.slice(0, 800) + '...' : extract;
                const caption = `📖 *${title}*\n\n${summary}\n\n🔗 ${content_urls?.desktop?.page || ''}`;
                if (thumbnail?.source) {
                    await sock.sendMessage(chatId, {
                        image: { url: thumbnail.source },
                        caption
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, { text: caption }, { quoted: message });
                }
            } catch (err) {
                if (err.response?.status === 404) {
                    await doReact('❌');
                    return await sock.sendMessage(chatId, {
                        text: `No Wikipedia article found for: *${text}*`
                    }, { quoted: message });
                }
                console.error('[ WIKI ] Error:', err.message);
                await doReact('❌');
                await sock.sendMessage(chatId, {
                    text: `Wikipedia search failed: ${err.message}`
                }, { quoted: message });
            }
            break;

        default:
            // Should not happen
            await sock.sendMessage(chatId, {
                text: '❌ Unknown search command.'
            }, { quoted: message });
            break;
    }
};