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

    if (!query) return await sock.sendMessage(chatId, { text: 'Provide a query!' });

    console.log(`[Pinterest] Starting search for: "${query}"`);

    try {
      const { data, status } = await axios.get(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
          "Accept": "text/html"
        }
      });

      console.log(`[Pinterest] Connection Status: ${status}`);
      
      if (!data) {
        console.log('[Pinterest] Error: Received empty HTML body.');
        return await sock.sendMessage(chatId, { text: '❌ Received empty response from Pinterest.' });
      }

      // Pinterest stores its data in a script tag called "jsInitData" or "initialData"
      // This regex grabs image URLs from the raw HTML source
      const re = /https:\/\/i\.pinimg\.com\/736x\/[a-zA-Z0-9\/]+\.(jpg|png|gif)/g;
      const allLinks = data.match(re);

      if (!allLinks || allLinks.length === 0) {
        console.log('[Pinterest] Regex failed to find any matches. Pinterest might have changed their HTML structure.');
        // Log a small snippet of the HTML to see what we are actually getting
        console.log('[Pinterest] HTML Snippet:', data.slice(0, 500)); 
        return await sock.sendMessage(chatId, { text: '❌ No images found. Pinterest blocked the scraper.' });
      }

      const uniqueImages = [...new Set(allLinks)].slice(0, 3);
      console.log(`[Pinterest] Found ${allLinks.length} links. Sending top ${uniqueImages.length} results.`);

      for (let i = 0; i < uniqueImages.length; i++) {
        // Converting thumbnail links to High-Res "originals"
        const highResUrl = uniqueImages[i].replace('/736x/', '/originals/');
        
        await sock.sendMessage(chatId, { 
          image: { url: highResUrl }, 
          caption: `*Pinterest Result (${i + 1}/3)*` 
        }, { quoted: i === 0 ? message : null });
        
        console.log(`[Pinterest] Image ${i+1} sent: ${highResUrl}`);
      }

    } catch (err) {
      console.error('[Pinterest] CRITICAL ERROR:', err.message);
      if (err.response) {
        console.error('[Pinterest] Response Data:', err.response.data.slice(0, 200));
        console.error('[Pinterest] Status:', err.response.status);
      }
      await sock.sendMessage(chatId, { text: `❌ Error: ${err.message}` });
    }
  }
};

