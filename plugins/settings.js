const fs = require('fs');
const isOwnerOrSudo = require('../lib/isOwner');
const store = require('../lib/lightweight_store');

function readJsonSafe(path, fallback) {
    try {
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

        try {
            const senderId = message.key.participant || message.key.remoteJid;
            const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

            if (!message.key.fromMe && !isOwner) {
                await sock.sendMessage(chatId, { 
                    text: '❌ Only bot owner can use this command!' 
                }, { quoted: message });
                return;
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
                antilink: {}, antibadword: {}, welcome: {}, goodbye: {}, chatbot: {}, antitag: {}, antibot: {}
            });
            const autoReaction = Boolean(userGroupData.autoReaction);

            const groupId = isGroup ? chatId : null;
            const antilinkOn = groupId ? Boolean(userGroupData.antilink && userGroupData.antilink[groupId]) : false;
            const antibadwordOn = groupId ? Boolean(userGroupData.antibadword && userGroupData.antibadword[groupId]) : false;
            const welcomeOn = groupId ? Boolean(userGroupData.welcome && userGroupData.welcome[groupId]) : false;
            const goodbyeOn = groupId ? Boolean(userGroupData.goodbye && userGroupData.goodbye[groupId]) : false;
            const chatbotOn = groupId ? Boolean(userGroupData.chatbot && userGroupData.chatbot[groupId]) : false;
            const antitagCfg = groupId ? (userGroupData.antitag && userGroupData.antitag[groupId]) : null;
            const antibotOn = groupId ? Boolean(userGroupData.antibot && userGroupData.antibot[groupId]) : false;

            const onEmoji = '✅';
            const offEmoji = '❌';
            
            let menuText = `╭━━━『 *⚙️ BOT SETTINGS* ━━╮\n\n`;
            
            menuText += `┏━━━━━━━━━━━━━━━━━━━┓\n`;
            menuText += `┃  *🌐 GLOBAL SETTINGS*\n`;
            menuText += `┗━━━━━━━━━━━━━━━━━━━┛\n\n`;
            
            menuText += `│ 🔰 *Bot Mode:* ${botMode || 'public'}\n`;
            menuText += `│ ${autoStatus.enabled ? onEmoji : offEmoji} *Auto Status*\n`;
            menuText += `│ ${autoread.enabled ? onEmoji : offEmoji} *Auto Read*\n`;
            menuText += `│ ${autotyping.enabled ? onEmoji : offEmoji} *Auto Typing*\n`;
            menuText += `│ ${pmblocker.enabled ? onEmoji : offEmoji} *PM Blocker*\n`;
            menuText += `│ ${anticall.enabled ? onEmoji : offEmoji} *Anti Call*\n`;
            menuText += `│ ${autoReaction ? onEmoji : offEmoji} *Auto Reaction*\n\n`;

            if (groupId) {
                // Group Settings Section
                menuText += `┏━━━━━━━━━━━━━━━━━━━┓\n`;
                menuText += `┃  *👥 GROUP SETTINGS*\n`;
                menuText += `┗━━━━━━━━━━━━━━━━━━━┛\n\n`;

                if (antilinkOn) {
                    const al = userGroupData.antilink[groupId];
                    menuText += `│ ${onEmoji} *Antilink* (${al.action || 'delete'})\n`;
                } else {
                    menuText += `│ ${offEmoji} *Antilink*\n`;
                }

                if (antibadwordOn) {
                    const ab = userGroupData.antibadword[groupId];
                    menuText += `│ ${onEmoji} *Anti Badword* (${ab.action || 'delete'})\n`;
                } else {
                    menuText += `│ ${offEmoji} *Anti Badword*\n`;
                }

                menuText += `│ ${welcomeOn ? onEmoji : offEmoji} *Welcome Message*\n`;
                menuText += `│ ${goodbyeOn ? onEmoji : offEmoji} *Goodbye Message*\n`;
                menuText += `│ ${chatbotOn ? onEmoji : offEmoji} *AI Chatbot*\n`;

                if (antitagCfg && antitagCfg.enabled) {
                    menuText += `│ ${onEmoji} *Anti Tag* (${antitagCfg.action || 'delete'})\n`;
                } else {
                    menuText += `│ ${offEmoji} *Anti Tag*\n`;
                }

                menuText += `│ ${antibotOn ? onEmoji : offEmoji} *Anti Bot*\n\n`;
            } else {
                menuText += `\n*ℹ️ Info:* Use this command in a group to see group-specific settings.\n\n`;
            }

            menuText += `╰━━━━━━━━━━━━━━━━━━╯\n\n`;
            menuText += `_🕐 Updated: ${new Date().toLocaleTimeString()}_`;

            await sock.sendMessage(chatId, { 
                text: menuText,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363319098372999@newsletter',
                        newsletterName: 'MEGA MD',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });

        } catch (error) {
            console.error('Settings Command Error:', error);
            await sock.sendMessage(chatId, { 
                text: '❌ Failed to read settings.' 
            }, { quoted: message });
        }
    }
};
     
