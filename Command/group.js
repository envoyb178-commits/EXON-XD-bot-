/**
 * WhatsApp-Bot
 * Copyright (c) 2026 KichuExe
 * XENO-MD
 *
 * This project is licensed under the MIT License.
 * You are free to use, modify, and distribute this software
 * in accordance with the terms of the license.
 *
 * @author KichuExe
 * @license MIT
 */

const config = require("../config");

// Helper: format number to JID
const formatNumberToJid = (number) => {
    if (!number) return null;
    return number.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
};

// Helper: get target JID
const getTarget = (m, text) => 
    if (text && text.trim()) return formatNumberToJid(text.trim());
    if (m.quoted) {
        // Check if quoted message is a number
        const quotedText = m.quoted.text || "";
        if (/^@?\d{10,15}$/.test(quotedText.trim())) {
            return formatNumberToJid(quotedText.trim());
        }
        return m.quoted.sender;
    }
    if (m.mentionedJid && m.mentionedJid[0]) return m.mentionedJid[0];
    return null;
};

const isOwner = (m) => m.sender.includes(config.ownerNumber.replace(/[^0-9]/g, ""));

// === ADD ===
const add = {
    name: "add",
    category: "group",
    async execute(conn, m, { text, isAdmins, isBotAdmins, participants }) {
        if (!m.isGroup) return;
        const jid = getTarget(m, text);
        if (!jid) return await m.reply("Reply to a message, or provide a number to add!");

        if (!isOwner(m) && !isAdmins) return await m.reply("You are not admin!");
        if (!isBotAdmins) return await m.reply("I'm not an admin!");

        const isAlreadyIn = participants.some(p => p.id === jid);
        if (isAlreadyIn) return await m.reply("This participant is already in the group!");

        try {
            const response = await conn.groupParticipantsUpdate(m.chat, [jid], 'add');
            for (let i of response) {
                if (i.status === '200') {
                    return await m.reply("@" + jid.split('@')[0] + " has been added to the group.", m.chat, { mentions: [jid] });
                }
                if (i.status === '401') {
                    return await m.reply("Oops! I’ve been blocked by that user. Can’t add them.");
                }
                if (i.status === '403') {
                    return await m.reply("This user has restricted who can add them to groups.");
                }
            }
        } catch (e) {
            await m.reply("Failed to add participant.");
        }
    }
};

// === KICK ===
const kick = {
    name: "kick",
    aliases: ["remove"],
    category: "group",
    async execute(conn, m, { text, isAdmins, isBotAdmins, participants }) {
        if (!m.isGroup) return;
        const jid = getTarget(m, text);
        if (!jid) return await m.reply("Reply to a message, or provide a number to kick!");

        if (!isOwner(m) && !isAdmins) return await m.reply("You are not admin!");
        if (!isBotAdmins) return await m.reply("I'm not an admin!");

        const isIn = participants.some(p => p.id === jid);
        if (!isIn) return await m.reply("This participant is not in the group!");

        try {
            await conn.groupParticipantsUpdate(m.chat, [jid], 'remove');
            return await m.reply("@" + jid.split('@')[0] + " has been removed from the group.", m.chat, { mentions: [jid] });
        } catch (e) {
            await m.reply("Failed to remove participant.");
        }
    }
};

// === PROMOTE ===
const promote = {
    name: "promote",
    category: "group",
    async execute(conn, m, { text, isAdmins, isBotAdmins, participants }) {
        if (!m.isGroup) return;
        const jid = getTarget(m, text);
        if (!jid) return await m.reply("Mention a user, reply to a message, or provide a number to promote!");

        if (!isOwner(m) && !isAdmins) return await m.reply("You are not admin!");
        if (!isBotAdmins) return await m.reply("I'm not an admin!");

        const participant = participants.find(p => p.id === jid);
        if (!participant) return await m.reply("This participant is not in the group!");
        if (participant.admin) return await m.reply("The user is already an admin.");

        try {
            await conn.groupParticipantsUpdate(m.chat, [jid], 'promote');
            return await m.reply("@" + jid.split('@')[0] + " has been promoted to admin.", m.chat, { mentions: [jid] });
        } catch (e) {
            await m.reply("Failed to promote participant.");
        }
    }
};

// === DEMOTE ===
const demote = {
    name: "demote",
    category: "group",
    async execute(conn, m, { text, isAdmins, isBotAdmins, participants }) {
        if (!m.isGroup) return;
        const jid = getTarget(m, text);
        if (!jid) return await m.reply("Mention a user, reply to a message, or provide a number to demote!");

        if (!isOwner(m) && !isAdmins) return await m.reply("You are not admin!");
        if (!isBotAdmins) return await m.reply("I'm not an admin!");

        const participant = participants.find(p => p.id === jid);
        if (!participant) return await m.reply("This participant is not in the group!");
        if (!participant.admin) return await m.reply("The user is not an admin.");

        try {
            await conn.groupParticipantsUpdate(m.chat, [jid], 'demote');
            return await m.reply("@" + jid.split('@')[0] + " is no longer an admin.", m.chat, { mentions: [jid] });
        } catch (e) {
            await m.reply("Failed to demote participant.");
        }
    }
};

// === MUTE ===
const mute = {
    name: "mute",
    aliases: ["close"],
    category: "group",
    async execute(conn, m, { isAdmins, isBotAdmins }) {
        if (!m.isGroup) return;
        if (!isOwner(m) && !isAdmins) return await m.reply("You are not admin!");
        if (!isBotAdmins) return await m.reply("I'm not an admin!");

        try {
            await conn.groupSettingUpdate(m.chat, 'announcement');
            return await m.reply("Muted!");
        } catch (e) {
            await m.reply("Failed to mute group.");
        }
    }
};

// === UNMUTE ===
const unmute = {
    name: "unmute",
    aliases: ["open"],
    category: "group",
    async execute(conn, m, { isAdmins, isBotAdmins }) {
        if (!m.isGroup) return;
        if (!isOwner(m) && !isAdmins) return await m.reply("You are not admin!");
        if (!isBotAdmins) return await m.reply("I'm not an admin!");

        try {
            await conn.groupSettingUpdate(m.chat, 'not_announcement');
            return await m.reply("Unmuted!");
        } catch (e) {
            await m.reply("Failed to unmute group.");
        }
    }
};

// === GLOCK ===
const glock = {
    name: "glock",
    desc: "Restrict group info editing to admins only.",
    category: "group",
    async execute(conn, m, { isAdmins, isBotAdmins }) {
        if (!m.isGroup) return;
        if (!isOwner(m) && !isAdmins) return await m.reply("You are not admin!");
        if (!isBotAdmins) return await m.reply("I'm not an admin!");

        try {
            await conn.groupSettingUpdate(m.chat, 'locked');
            return await m.reply("Group settings have been locked. Only admins can edit now.");
        } catch (e) {
            await m.reply("Failed to lock group settings.");
        }
    }
};

// === GUNLOCK ===
const gunlock = {
    name: "gunlock",
    desc: "Allow all participants to edit group info.",
    category: "group",
    async execute(conn, m, { isAdmins, isBotAdmins }) {
        if (!m.isGroup) return;
        if (!isOwner(m) && !isAdmins) return await m.reply("You are not admin!");
        if (!isBotAdmins) return await m.reply("I'm not an admin!");

        try {
            await conn.groupSettingUpdate(m.chat, 'unlocked');
            return await m.reply("Group settings have been unlocked. All participants can now edit.");
        } catch (e) {
            await m.reply("Failed to unlock group settings.");
        }
    }
};

// === GNAME ===
const gname = {
    name: "gname",
    desc: "Change group subject (name).",
    category: "group",
    async execute(conn, m, { text, isAdmins, isBotAdmins }) {
        if (!m.isGroup) return;
        if (!text) return await m.reply("Please provide a new group name.");
        if (!isOwner(m) && !isAdmins) return await m.reply("You are not admin!");
        if (!isBotAdmins) return await m.reply("I'm not an admin!");

        try {
            await conn.groupUpdateSubject(m.chat, text);
            return await m.reply("Group name changed to: " + text);
        } catch (e) {
            await m.reply("Failed to change group name.");
        }
    }
};

// === GDESC ===
const gdesc = {
    name: "gdesc",
    desc: "Change group description.",
    category: "group",
    async execute(conn, m, { text, isAdmins, isBotAdmins }) {
        if (!m.isGroup) return;
        if (!text) return await m.reply("Please provide a new group description.");
        if (!isOwner(m) && !isAdmins) return await m.reply("You are not admin!");
        if (!isBotAdmins) return await m.reply("I'm not an admin!");

        try {
            await conn.groupUpdateDescription(m.chat, text);
            return await m.reply("Group description changed to: " + text);
        } catch (e) {
            await m.reply("Failed to change group description.");
        }
    }
};

// === TAGALL ===
const tagall = {
    name: "tagall",
    aliases: ["everyone", "all"],
    category: "group",
    async execute(conn, m, { text, isAdmins, participants, readMore, botJid }) {
        if (!m.isGroup) return;
        if (!isOwner(m) && !isAdmins) return await m.reply("You are not admin!");

        const header = text ? `📢 *${text}*` : `📢 *Attention everyone!*`;
        const list = participants
            .filter(p => p.id !== botJid)
            .map((e, i) => `${i + 1}. @${e.id.split('@')[0]}`)
            .join("\n");

        const msg = `*┏━━━━━━━ TAG ALL ━━━━━━━┓*\n\n` +
            `${header}\n\n` +
            `*Message:* ${text || "None"}\n` +
            `*Members:* ${participants.length}\n` +
            `${readMore || ""}\n\n` +
            `${list}\n\n` +
            `*╰────────────────────*`;

        await conn.sendMessage(m.chat, {
            text: msg,
            mentions: participants.map(i => i.id)
        }, { quoted: m });
    }
};

// === INVITE ===
const invite = {
    name: "invite",
    aliases: ["invitelink", "link"],
    category: "group",
    async execute(conn, m, { isAdmins, isBotAdmins }) {
        if (!m.isGroup) return;
        if (!isOwner(m) && !isAdmins) return await m.reply("You are not admin!");
        if (!isBotAdmins) return await m.reply("I'm not an admin!");

        try {
            const code = await conn.groupInviteCode(m.chat);
            return await m.reply("https://chat.whatsapp.com/" + code);
        } catch (e) {
            await m.reply("Failed to generate invite link!");
        }
    }
};

// === REVOKE ===
const revoke = {
    name: "revoke",
    aliases: ["resetlink"],
    category: "group",
    async execute(conn, m, { isAdmins, isBotAdmins }) {
        if (!m.isGroup) return;
        if (!isOwner(m) && !isAdmins) return await m.reply("You are not admin!");
        if (!isBotAdmins) return await m.reply("I'm not an admin!");

        try {
            await conn.groupRevokeInvite(m.chat);
            return await m.reply("Group invite link has been revoked.");
        } catch (e) {
            await m.reply("Failed to revoke invite link!");
        }
    }
};

// === GROUPINFO 
const groupinfo = {
    name: "groupinfo",
    aliases: ["ginfo", "gid"],
    category: "group",
    async execute(conn, m, { text, groupMetadata, participants, config, plugins }) {
        let metadata = groupMetadata;
        let link = "";

        // Handle group link if provided or current group
        if (text && text.includes("chat.whatsapp.com/")) {
            const code = text.split("chat.whatsapp.com/")[1].split(" ")[0];
            try {
                metadata = await conn.groupGetInviteInfo(code);
                link = `https://chat.whatsapp.com/${code}`;
            } catch (e) {
                return await m.reply("Invalid group link!");
            }
        } else if (!m.isGroup) {
            return await m.reply("Please provide a group link or use this command in a group!");
        }

        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(metadata.id || m.chat, 'image');
        } catch (e) {
            ppUrl = config.thumbUrl;
        }

        const admins = metadata.participants ? metadata.participants.filter(v => v.admin) : [];
        const uniqueCommands = new Set(Array.from(plugins.values()).map(p => p.name));
        
        const infoText = `*—「 GROUP DETAILS 」—*\n` +
            `❖ *Name:* ${metadata.subject}\n` +
            `❖ *ID:* ${metadata.id || m.chat}\n` +
            `❖ *Owner:* ${metadata.owner ? "@" + metadata.owner.split("@")[0] : "Unknown"}\n` +
            `❖ *Members:* ${metadata.size || participants.length}\n` +
            `❖ *Admins:* ${admins.length || "N/A"}\n` +
            `❖ *Created:* ${new Date(metadata.creation * 1000).toLocaleDateString()}\n` +
            `❖ *Restricted:* ${metadata.restrict ? "Yes" : "No"}\n` +
            `❖ *Announced:* ${metadata.announce ? "Yes" : "No"}\n` +
            `❖ *Approval:* ${metadata.membershipApprovalMode ? "Required" : "Not Required"}\n` +
            `❖ *Ephemeral:* ${metadata.ephemeralDuration ? (metadata.ephemeralDuration / 86400) + " Days" : "Off"}\n` +
            `❖ *Description:* ${metadata.desc?.toString() || "No Description"}\n\n` +
            `*—「 BOT DETAILS 」—*\n` +
            `❖ *Bot:* ${config.botName}\n` +
            `❖ *Commands:* ${uniqueCommands.size}\n` +
            `❖ *Owner:* ${config.ownerName}\n\n` +
            `*Powered By ${config.botName}*`;

        await conn.sendMessage(m.chat, {
            image: { url: ppUrl },
            caption: infoText,
            mentions: [...(metadata.owner ? [metadata.owner] : []), ...(admins.map(v => v.id) || [])],
            contextInfo: {
                externalAdReply: {
                    title: metadata.subject,
                    body: "Group Information",
                    thumbnailUrl: ppUrl,
                    sourceUrl: link || "https://xenosir.vercel.app",
                    mediaType: 1,
                    showAdAttribution: true
                }
            }
        }, { quoted: m });
    }
};

module.exports = [
    add, kick, promote, demote,
    mute, unmute, glock, gunlock,
    gname, gdesc, tagall, invite,
    revoke, groupinfo
];
