/*****************************************************************************
 *                                                                           *
 *                     Developed By Qasim Ali                                *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/GlobalTechInfo                         *
 *  ▶️  YouTube  : https://youtube.com/@GlobalTechInfo                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VagJIAr3bbVBCpEkAM07     *
 *                                                                           *
 *    © 2026 GlobalTechInfo. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the MEGA-MD Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/


const fs = require('fs');
const path = require('path');
const { printLog } = require('../lib/print');

const DATA_FILE = path.join('./data', 'userGroupData.json');

const messagePatterns = new Map();

/**
 * Read antibot settings from file
 */
function getAntibotSettings(chatId) {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return null;
        }
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        return data.antibot?.[chatId] || null;
    } catch (error) {
        printLog('error', `Error reading antibot settings: ${error.message}`);
        return null;
    }
}

/**
 * Save antibot settings to file
 */
function setAntibotSettings(chatId, enabled) {
    try {
        let data = { antibot: {} };
        
        if (fs.existsSync(DATA_FILE)) {
            data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
        
        if (!data.antibot) {
            data.antibot = {};
        }
        
        if (enabled) {
            data.antibot[chatId] = { enabled: true };
            printLog('success', `Antibot enabled for group: ${chatId}`);
        } else {
            delete data.antibot[chatId];
            printLog('info', `Antibot disabled for group: ${chatId}`);
        }
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        printLog('error', `Error saving antibot settings: ${error.message}`);
        return false;
    }
}

/**
 * Check if a JID is likely a bot based on multiple signals
 */
async function isLikelyBot(sock, jid, chatId) {
    try {
        printLog('info', `Checking if ${jid} is a bot...`);
        
        let botScore = 0;
        const reasons = [];

        const botJid = sock.user?.id || sock.user?.jid;

        if (jid !== botJid && jid.endsWith('@lid')) {
            botScore += 20;
            reasons.push('Lidded account');
        }

        try {
            const user = await sock.onWhatsApp(jid);
            if (user && user[0]) {
                if (user[0].isBusiness) {
                    botScore += 40;
                    reasons.push('Business account');
                }
                if (user[0].verifiedName) {
                    botScore += 30;
                    reasons.push('Verified name');
                }
            }
        } catch (e) {
        }

        if (sock.store?.contacts?.[jid]) {
            const contact = sock.store.contacts[jid];
            if (contact.verifiedName) {
                botScore += 30;
                reasons.push('Verified in contacts');
            }
            if (contact.isBusiness) {
                botScore += 40;
                reasons.push('Business in contacts');
            }
        }

        try {
            const ppUrl = await sock.profilePictureUrl(jid, 'image');
            if (!ppUrl) {
                botScore += 10;
                reasons.push('No profile picture');
            }
        } catch (e) {
            botScore += 10;
            reasons.push('No profile picture');
        }

        const pattern = messagePatterns.get(jid);
        if (pattern) {
            const timeSinceFirst = (Date.now() - pattern.firstSeen) / 1000;

            if (pattern.commands >= 3 && timeSinceFirst < 300) {
                botScore += 35;
                reasons.push(`${pattern.commands} commands in ${Math.round(timeSinceFirst)}s`);
            }
            
            if (pattern.commands >= 5 && timeSinceFirst < 60) {
                botScore += 45;
                reasons.push(`Fast commands: ${pattern.commands} in ${Math.round(timeSinceFirst)}s`);
            }
            
            if (pattern.count > 10 && timeSinceFirst < 300) {
                botScore += 20;
                reasons.push(`${pattern.count} messages rapidly`);
            }
        }

        printLog('info', `Bot detection score for ${jid}: ${botScore}/100`);
        printLog('info', `Reasons: ${reasons.join(', ') || 'None'}`);

        return { isBot: botScore >= 35, score: botScore, reasons };
    } catch (error) {
        printLog('error', `Error checking if user is bot: ${error.message}`);
        return { isBot: false, score: 0, reasons: [] };
    }
}

/**
 * Monitor messages for bot-like behavior
 */
async function monitorMessageForBotBehavior(sock, message) {
    try {
        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;

        if (!chatId.endsWith('@g.us')) return;

        const settings = getAntibotSettings(chatId);
        if (!settings?.enabled) return;

        const botJid = sock.user?.id || sock.user?.jid;
        if (senderId === botJid) return;

        const messageText = 
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            '';

        if (!messagePatterns.has(senderId)) {
            messagePatterns.set(senderId, {
                count: 0,
                commands: 0,
                firstSeen: Date.now(),
                lastSeen: Date.now()
            });
        }

        const pattern = messagePatterns.get(senderId);
        pattern.count++;
        pattern.lastSeen = Date.now();

        const prefixes = ['.', '!', '#', '/'];
        if (prefixes.some(p => messageText.trim().startsWith(p))) {
            pattern.commands++;
            printLog('info', `${senderId} sent command #${pattern.commands}: ${messageText.substring(0, 20)}`);
        }
        
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        for (const [jid, data] of messagePatterns.entries()) {
            if (data.lastSeen < oneHourAgo) {
                messagePatterns.delete(jid);
            }
        }

        const timeSinceFirstMessage = (Date.now() - pattern.firstSeen) / 1000;

        if (pattern.commands >= 3 && timeSinceFirstMessage < 120) {
            printLog('warning', `Suspicious bot behavior detected from ${senderId}`);
            
            const detection = await isLikelyBot(sock, senderId, chatId);
            
            if (detection.isBot || detection.score >= 30 || pattern.commands >= 5) {
                try {
                    const metadata = await sock.groupMetadata(chatId);
                    const botIsAdmin = metadata.participants.find(p => p.id === botJid)?.admin;
                    
                    if (!botIsAdmin) {
                        printLog('error', `Bot is not admin in group ${chatId}`);
                        return;
                    }

                    await sock.sendMessage(chatId, {
                        text: `⚠️ *ANTIBOT ACTIVATED*\n\n❌ Bot-like behavior detected!\n\n🚫 Removing @${senderId.split('@')[0]}...\n\n_Detection Score: ${detection.score}/100_\n_Commands sent: ${pattern.commands}_\n_Time: ${Math.round(timeSinceFirstMessage)}s_\n_Reasons: ${detection.reasons.join(', ')}_`,
                        mentions: [senderId],
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363319098372999@newsletter',
                                newsletterName: 'MEGA MD',
                                serverMessageId: -1
                            }
                        }
                    });

                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    
                    printLog('success', `Bot removed: ${senderId} from ${chatId}`);
                    messagePatterns.delete(senderId);
                } catch (error) {
                    printLog('error', `Failed to remove suspected bot: ${error.message}`);
                }
            }
        }
    } catch (error) {
        printLog('error', `Error monitoring message for bot behavior: ${error.message}`);
    }
}

/**
 * Handle bot detection when new members join
 */
async function handleBotDetection(sock, update) {
    try {
        const { id: chatId, participants, action } = update;

        printLog('info', `Group update - Action: ${action}, Chat: ${chatId}`);

        if (action !== 'add') return;

        const settings = getAntibotSettings(chatId);
        
        if (!settings?.enabled) {
            printLog('info', `Antibot is not enabled for group ${chatId}`);
            return;
        }

        const botJid = sock.user?.id || sock.user?.jid;
        printLog('info', `Checking ${participants.length} new participants for bot signals`);
        
        for (const participantJid of participants) {
            printLog('info', `Checking participant: ${participantJid}`);
            
            if (participantJid === botJid) continue;

            const detection = await isLikelyBot(sock, participantJid, chatId);

            if (detection.isBot || detection.score >= 30) {
                printLog('warning', `Bot detected: ${participantJid} (Score: ${detection.score})`);
                
                try {
                    const metadata = await sock.groupMetadata(chatId);
                    const botIsAdmin = metadata.participants.find(p => p.id === botJid)?.admin;
                    
                    if (!botIsAdmin) {
                        printLog('error', `Bot is not admin in group ${chatId}`);
                        await sock.sendMessage(chatId, {
                            text: '⚠️ *ANTIBOT ALERT*\n\nA suspicious account joined but I need admin privileges to remove it!',
                            contextInfo: {
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: '120363319098372999@newsletter',
                                    newsletterName: 'MEGA MD',
                                    serverMessageId: -1
                                }
                            }
                        });
                        continue;
                    }
                    
                    await sock.sendMessage(chatId, {
                        text: `⚠️ *ANTIBOT ACTIVATED*\n\n❌ Bot account detected!\n\n🚫 Removing @${participantJid.split('@')[0]}...\n\n_Detection Score: ${detection.score}/100_\n_Signals: ${detection.reasons.join(', ')}_`,
                        mentions: [participantJid],
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363319098372999@newsletter',
                                newsletterName: 'MEGA MD',
                                serverMessageId: -1
                            }
                        }
                    });

                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.groupParticipantsUpdate(chatId, [participantJid], 'remove');

                    printLog('success', `Bot removed: ${participantJid} from ${chatId}`);

                } catch (error) {
                    printLog('error', `Failed to remove bot ${participantJid}: ${error.message}`);
                    
                    await sock.sendMessage(chatId, {
                        text: '⚠️ Failed to remove the bot. Make sure I have admin privileges!',
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363319098372999@newsletter',
                                newsletterName: 'MEGA MD',
                                serverMessageId: -1
                            }
                        }
                    });
                }
            } else {
                printLog('info', `${participantJid} passed bot detection (Score: ${detection.score})`);
            }
        }
    } catch (error) {
        printLog('error', `Error in handleBotDetection: ${error.message}`);
        console.error(error);
    }
}

module.exports = {
    command: 'antibot',
    aliases: ['antib', 'botblock'],
    category: 'admin',
    description: 'Prevent bots from joining the group',
    usage: '.antibot <on|off>',
    groupOnly: true,
    adminOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (!action) {
            const settings = getAntibotSettings(chatId);
            await sock.sendMessage(chatId, {
                text: `╭━『 *🤖 ANTIBOT SETUP* 』━╮\n\n` +
                      `│ *Current Status:* ${settings?.enabled ? '✅ Enabled' : '❌ Disabled'}\n\n` +
                      `├─ *Commands:*\n` +
                      `│  • \`.antibot on\` - Enable\n` +
                      `│  • \`.antibot off\` - Disable\n\n` +
                      `├─ *Detection Method:*\n` +
                      `│  Monitors for bot-like behavior:\n` +
                      `│  • Multiple commands rapidly\n` +
                      `│  • Business/Verified accounts\n` +
                      `│  • Lidded account patterns\n` +
                      `│  • Profile analysis\n\n` +
                      `├─ *Trigger:*\n` +
                      `│  • 3+ commands in 2 minutes\n` +
                      `│  • Detection score 30+/100\n\n` +
                      `╰━━━━━━━━━━━━━━━━━━╯`,
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
            return;
        }

        switch (action) {
            case 'on':
            case 'enable':
                const existingSettings = getAntibotSettings(chatId);
                if (existingSettings?.enabled) {
                    await sock.sendMessage(chatId, {
                        text: '⚠️ *Antibot is already enabled in this group!*',
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
                    return;
                }
                
                const result = setAntibotSettings(chatId, true);
                await sock.sendMessage(chatId, {
                    text: result 
                        ? '✅ *ANTIBOT ACTIVATED*\n\nBot detection is now active!\n\n⚡ Trigger: 3+ commands in 2 minutes\n🎯 Threshold: 30+ detection score'
                        : '❌ *Failed to enable antibot*',
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
                break;

            case 'off':
            case 'disable':
                setAntibotSettings(chatId, false);
                await sock.sendMessage(chatId, {
                    text: '❌ *ANTIBOT DEACTIVATED*\n\nBot detection has been disabled.',
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
                break;

            default:
                await sock.sendMessage(chatId, {
                    text: '❌ *Invalid option*\n\nUse `.antibot` to see available commands.',
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
        }
    },

    handleBotDetection,
    monitorMessageForBotBehavior
};

/*****************************************************************************
 *                                                                           *
 *                     Developed By Qasim Ali                                *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/GlobalTechInfo                         *
 *  ▶️  YouTube  : https://youtube.com/@GlobalTechInfo                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VagJIAr3bbVBCpEkAM07     *
 *                                                                           *
 *    © 2026 GlobalTechInfo. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the MEGA-MD Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/

