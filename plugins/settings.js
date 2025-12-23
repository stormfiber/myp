const fs = require('fs');
const isOwnerOrSudo = require('../lib/isOwner');
const store = require('../lib/lightweight_store');
const { cleanJid } = require('../lib/isOwner');

function readJsonSafe(path, fallback) {
    try {
        if (!fs.existsSync(path)) return fallback;
        const txt = fs.readFileSync(path, 'utf8');
        return JSON.parse(txt);
    } catch (_) {
        return fallback;
    }
}

module.exports = {
    command: 'settings',
    aliases: ['config', 'setting'],
    category: 'owner',
    description: 'Show bot settings and per-group configurations',
    usage: '.settings',
    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;

        try {
            const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
            const isMe = message.key.fromMe;

            if (!isMe && !isOwner) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ *Access Denied:* Only Owner/Sudo can view settings.' 
                }, { quoted: message });
            }
            
            const isGroup = chatId.endsWith('@g.us');
            const dataDir = './data';

            const botMode = await store.getBotMode();
            const autoStatus = readJsonSafe(`${dataDir}/autoStatus.json`, { enabled: false });
            const autoread = readJsonSafe(`${dataDir}/autoread.json`, { enabled: false });
            const autotyping = readJsonSafe(`${dataDir}/autotyping.json`, { enabled: false });
            const pmblocker = readJsonSafe(`${dataDir}/pmblocker.json`, { enabled: false });
            const anticall = readJsonSafe(`${dataDir}/anticall.json`, { enabled: false });
            
            const userGroupData = readJsonSafe(`${dataDir}/userGroupData.json`, {
                antilink: {}, antibadword: {}, welcome: {}, goodbye: {}, chatbot: {}, antitag: {}, autoReaction: false
            });
            const autoReaction = Boolean(userGroupData.autoReaction);

            const getSt = (val) => val ? '✅' : '❌';

            let menuText = `╭━━〔 *MEGA-MD CONFIG* 〕━┈\n┃\n`;
            menuText += `┃ 👤 *User:* @${cleanJid(senderId)}\n`;
            menuText += `┃ 🤖 *Mode:* ${botMode.toUpperCase()}\n`;
            menuText += `┃\n┣━〔 *GLOBAL CONFIG* 〕━┈\n`;
            menuText += `┃ ${getSt(autoStatus?.enabled)} *Auto Status*\n`;
            menuText += `┃ ${getSt(autoread?.enabled)} *Auto Read*\n`;
            menuText += `┃ ${getSt(autotyping?.enabled)} *Auto Typing*\n`;
            menuText += `┃ ${getSt(pmblocker?.enabled)} *PM Blocker*\n`;
            menuText += `┃ ${getSt(anticall?.enabled)} *Anti Call*\n`;
            menuText += `┃ ${getSt(autoReaction)} *Auto Reaction*\n`;
            menuText += `┃\n`;

            if (isGroup) {
                const groupAntilink = (userGroupData.antilink || {})[chatId] || { enabled: false };
                const groupBadword = (userGroupData.antibadword || {})[chatId] || { enabled: false };
                const groupAntitag = (userGroupData.antitag || {})[chatId] || { enabled: false };
                const groupChatbot = (userGroupData.chatbot || {})[chatId] || false;
                const groupWelcome = (userGroupData.welcome || {})[chatId] || false;
                const groupGoodbye = (userGroupData.goodbye || {})[chatId] || false;

                menuText += `┣━〔 *GROUP CONFIG* 〕━┈\n`;
                menuText += `┃ ${getSt(groupAntilink.enabled)} *Antilink*\n`;
                menuText += `┃ ${getSt(groupBadword.enabled)} *Antibadword*\n`;
                menuText += `┃ ${getSt(groupAntitag.enabled)} *Antitag*\n`;
                menuText += `┃ ${getSt(groupChatbot)} *Chatbot*\n`;
                menuText += `┃ ${getSt(groupWelcome)} *Welcome*\n`;
                menuText += `┃ ${getSt(groupGoodbye)} *Goodbye*\n`;
            } else {
                menuText += `┃ 💡 *Note:* _Use in group for group configs._\n`;
            }

            menuText += `┃\n╰━━━━━━━━━━━━━━━━┈`;

            await sock.sendMessage(chatId, { 
                text: menuText,
                mentions: [senderId],
                contextInfo: {
                    externalAdReply: {
                        title: "SYSTEM SETTINGS PANEL",
                        body: "Configuration Status",
                        thumbnailUrl: "https://github.com/GlobalTechInfo.png",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: message });

        } catch (error) {
            console.error('Settings Command Error:', error);
            await sock.sendMessage(chatId, { text: '❌ Error: Settings file is corrupted or missing.' }, { quoted: message });
        }
    }
};
