const store = require('../lib/lightweight_store');

module.exports = {
  command: 'wainfo',
  aliases: ['wastalk', 'infowa'],
  category: 'owner',
  description: 'Fetch user details (Resolves LID to Phone Number)',
  usage: '.wainfo 92305xxxxx',

  async handler(sock, message, args, context = {}) {
    const chatId = message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');

    let target;
    const quoted = message.message?.extendedTextMessage?.contextInfo;
    if (quoted?.mentionedJid?.[0]) {
      target = quoted.mentionedJid[0];
    } else if (quoted?.participant) {
      target = quoted.participant;
    } else if (args[0]) {
      target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    } else {
      target = message.key.participant || message.key.remoteJid;
    }

    try {
      let realJid = target;

      if (target.endsWith('@lid') && isGroup) {
        const metadata = await sock.groupMetadata(chatId);
        const participant = metadata.participants.find(p => p.id === target);
        if (participant?.id) {
           realJid = participant.jid || participant.id.replace('@lid', '@s.whatsapp.net');
        }
      }

      const ppUrl = await sock.profilePictureUrl(realJid, 'image').catch(() => 
                    sock.profilePictureUrl(target, 'image').catch(() => null));

      const contact = store.contacts?.[target] || store.contacts?.[realJid] || {};
      const name = contact.name || contact.notify || 'Stranger';

      let bio = 'No Bio found';
      try {
        const result = await sock.query({
          tag: 'iq',
          attrs: { to: realJid, type: 'get', xmlns: 'status' },
          content: [{ tag: 'status', attrs: {} }]
        });
        if (result?.content?.[0]?.content) bio = result.content[0].content.toString();
      } catch (e) {
        bio = 'Private/Not Set';
      }

      const cleanNumber = realJid.split('@')[0].split(':')[0];
      const link = `https://wa.me/${cleanNumber}`;

      let report = `👤 *USER INFO*\n\n`;
      report += `📱 *Number:* ${cleanNumber}\n`;
      report += `🏷️ *Name:* ${name}\n`;
      report += `📝 *Bio:* ${bio}\n`;
      report += `🔗 *Link:* ${link}\n\n`;
      
      if (target.endsWith('@lid')) {
          report += `_Note: User was using a masked ID (LID). Resolved to PN._`;
      }

      if (ppUrl) {
        await sock.sendMessage(chatId, { image: { url: ppUrl }, caption: report }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text: report }, { quoted: message });
      }

    } catch (error) {
      console.error('Whois Error:', error);
      await sock.sendMessage(chatId, { text: '❌ Error resolving user.' });
    }
  }
};
