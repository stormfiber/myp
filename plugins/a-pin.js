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
      return await sock.sendMessage(chatId, { text: 'Provide a search term!' }, { quoted: message });
    }

    try {
      // 1. Fetch the search page directly
      const { data } = await axios.get(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
        }
      });

      // 2. Regex to find all original resolution image URLs
      // This looks for patterns like "https://i.pinimg.com/originals/...jpg"
      const re = /https:\/\/i\.pinimg\.com\/originals\/[a-z0-9\/]+\.(jpg|png|gif)/g;
      const allImages = data.match(re);

      // 3. Check if we actually found images
      if (!allImages || allImages.length === 0) {
        return await sock.sendMessage(chatId, { text: '❌ No images found for this query.' }, { quoted: message });
      }

      // 4. Remove duplicates and pick the first 3
      const uniqueImages = [...new Set(allImages)].slice(0, 3);

      // 5. Send images
      for (let i = 0; i < uniqueImages.length; i++) {
        await sock.sendMessage(chatId, { 
          image: { url: uniqueImages[i] }, 
          caption: `*Result (${i + 1}/3)*` 
        }, { quoted: i === 0 ? message : null });
      }

    } catch (err) {
      console.error('Pinterest Error:', err.message);
      await sock.sendMessage(chatId, { text: '❌ Failed to connect to Pinterest.' }, { quoted: message });
    }
  }
};

