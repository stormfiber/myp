const axios = require('axios');

module.exports = {
  command: 'pinterest',
  aliases: ['pin', 'pint'],
  category: 'tools',
  description: 'Search and send 3 images from Pinterest',
  usage: '.pinterest <query>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ');

    if (!query) {
      return await sock.sendMessage(chatId, { 
        text: '*Error:* Please provide a search term.\n\nExample: `.pinterest lofi anime`' 
      }, { quoted: message });
    }

    try {
      const searchUrl = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}&data=%7B%22options%22%3A%7B%22isPrefetch%22%3Afalse%2C%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22scope%22%3A%22pins%22%2C%22no_fetch_context_on_resource%22%3Afalse%7D%2C%22context%22%3A%7B%7D%7D`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'Referer': 'https://www.pinterest.com/',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      const results = response.data.resource_response.data.results;
      
      if (!results || results.length === 0) {
        return await sock.sendMessage(chatId, { text: '❌ No results found.' }, { quoted: message });
      }

      // 3. Extract top 3 unique images
      const images = results.slice(0, 3).map(item => item.images.orig.url);

      // 4. Send images one by one
      for (let i = 0; i < images.length; i++) {
        await sock.sendMessage(chatId, { 
          image: { url: images[i] }, 
          caption: `*Result (${i + 1}/3) for:* ${query}` 
        }, { quoted: i === 0 ? message : null }); // Only quotes the user on the first image to keep chat clean
      }

    } catch (err) {
      console.error('Pinterest Plugin Error:', err);
      await sock.sendMessage(chatId, { text: '❌ Service temporarily unavailable. Please try again later.' }, { quoted: message });
    }
  }
};
