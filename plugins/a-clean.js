const isAdmin = require('../lib/isAdmin');
const isOwnerOrSudo = require('../lib/isOwner');

module.exports = {
  command: 'wipe',
  aliases: ['clean', 'purge'],
  category: 'admin',
  description: 'Force delete messages (bot/all/prefix)',
  usage: '.wipe [bot | all | prefix] [count]',

  async handler(sock, message, args, context = {}) {
    const chatId = message.key.remoteJid;
    const senderId = message.key.participant || message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');

    try {
      const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
      let isAdm = false;
      let isBotAdm = false;

      if (isGroup) {
        const adminCheck = await isAdmin(sock, chatId, senderId);
        isAdm = adminCheck.isSenderAdmin;
        isBotAdm = adminCheck.isBotAdmin;
      } else {
        isAdm = true; 
      }

      if (!isOwner && !isAdm) return;

      const type = args[0]?.toLowerCase() || 'bot';
      const count = parseInt(args[1]) || 20;
      const storeData = sock.store || {};
      let messages = [];

      if (storeData.messages && storeData.messages[chatId]) {
        const chatStore = storeData.messages[chatId];
        messages = chatStore.array || (chatStore.toJSON ? chatStore.toJSON() : []);
      }

      const quoted = message.message?.extendedTextMessage?.contextInfo;
      if (messages.length === 0 && quoted?.stanzaId) {
        messages = [{
          key: {
            remoteJid: chatId,
            fromMe: quoted.participant === (sock.user?.id?.split(':')[0] + '@s.whatsapp.net'),
            id: quoted.stanzaId,
            participant: quoted.participant
          },
          message: quoted.quotedMessage
        }];
      }

      if (messages.length === 0) {
        return await sock.sendMessage(chatId, { 
          text: `❌ *Store Empty.*\n\nThis happens because the bot just restarted.\n\n*Fix:* Reply to a message with \`.wipe\` to delete it and start the session memory.` 
        });
      }

      let deletedCount = 0;
      const toDelete = [...messages].reverse().slice(0, count);

      for (const msg of toDelete) {
        if (msg.key.id === message.key.id) continue;

        let shouldDelete = false;
        const isFromMe = msg.key.fromMe;

        if (type === 'bot') {
          if (isFromMe) shouldDelete = true;
        } else if (type === 'all') {
          if (isFromMe || isBotAdm) shouldDelete = true;
        } else if (type === 'prefix') {
          const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
          if (body.startsWith('.') || body.startsWith('!')) {
             if (isFromMe || isBotAdm) shouldDelete = true;
          }
        }

        if (shouldDelete) {
          try {
            await sock.sendMessage(chatId, { delete: msg.key });
            deletedCount++;
            await new Promise(res => setTimeout(res, 250)); // Avoid rate limits
          } catch (e) { continue; }
        }
      }

      const report = await sock.sendMessage(chatId, { text: `🧹 *Wipe:* Deleted ${deletedCount} messages.` });
      
      setTimeout(async () => {
        try {
          await sock.sendMessage(chatId, { delete: report.key });
          await sock.sendMessage(chatId, { delete: message.key });
        } catch (e) {}
      }, 4000);

    } catch (error) {
      console.error('Wipe Error:', error);
      await sock.sendMessage(chatId, { text: '❌ Error: ' + error.message });
    }
  }
};
