const axios = require('axios');

module.exports = {
  command: 'unshorten',
  aliases: ['expand', 'trace'],
  category: 'tools',
  description: 'See where a short link actually goes',
  usage: '.expand <short_url>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args[0];

    if (!url) return await sock.sendMessage(chatId, { text: '❌ Paste a link to expand.' });

    try {
      const res = await axios.get(url, { maxRedirects: 5 });
      const finalUrl = res.request.res.responseUrl || url;

      await sock.sendMessage(chatId, { 
        text: `*🔗 Link Trace Results:*\n\n*Original:* ${url}\n*Destination:* ${finalUrl}` 
      }, { quoted: message });

    } catch (err) {
      await sock.sendMessage(chatId, { text: '❌ Link is dead or unreachable.' });
    }
  }
};
