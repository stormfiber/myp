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
 

const settings = require('../settings');
const { isSudo } = require('./index');


function cleanJid(jid) {
    if (!jid) return '';
    return jid.split(':')[0].split('@')[0];
}

/**
 * Check if user is owner or sudo
 */
async function isOwnerOrSudo(senderId, sock = null, chatId = null) {
    const ownerNumberClean = cleanJid(settings.ownerNumber);
    const senderIdClean = cleanJid(senderId);

    if (senderIdClean === ownerNumberClean) {
        return true;
    }

    const isSudoUser = await isSudo(senderId);
    if (isSudoUser) {
        return true;
    }

    if (sock && chatId && chatId.endsWith('@g.us') && senderId.includes('@lid')) {
        try {
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants || [];
            
            const participant = participants.find(p => p.lid === senderId || p.id === senderId);
            
            if (participant) {
                const pRealIdClean = cleanJid(participant.id);
                if (pRealIdClean === ownerNumberClean || await isSudo(participant.id)) {
                    return true;
                }
            }
        } catch (e) {
        }
    }
    
    return false;
}

function isOwnerOnly(senderId) {
    const ownerNumberClean = cleanJid(settings.ownerNumber);
    const senderIdClean = cleanJid(senderId);
    return senderIdClean === ownerNumberClean;
}

async function getCleanName(jid, sock) {
    if (!jid) return 'Unknown';
    const cleanNumber = cleanJid(jid);
    
    try {
        if (sock) {
            const contact = await sock.onWhatsApp(jid);
            if (contact && contact[0] && contact[0].exists) {
                return cleanNumber;
            }
        }
    } catch (e) {}

    return cleanNumber;
}

module.exports = isOwnerOrSudo;
module.exports.isOwnerOnly = isOwnerOnly;
module.exports.cleanJid = cleanJid;
module.exports.getCleanName = getCleanName;



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
 

