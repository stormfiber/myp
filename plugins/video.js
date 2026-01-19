const yts = require('yt-search');
const { ytmp4 } = require('ruhend-scraper');

module.exports = {
  command: 'video',
  aliases: ['ytmp4', 'ytvideo', 'ytdl'],
  category: 'download',
  description: 'Download YouTube videos by link or search',
  usage: '.video <youtube link | search query>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const query = args.join(' ').trim();

      if (!query) {
        return await sock.sendMessage(
          chatId,
          { text: '🎥 *What video do you want to download?*\nExample:\n.video Alan Walker Faded' },
          { quoted: message }
        );
      }

      let videoUrl = '';
      let searchTitle = '';
      let searchThumbnail = '';

      if (query.startsWith('http://') || query.startsWith('https://')) {
        videoUrl = query;
      } else {
        const { videos } = await yts(query);

        if (!videos || videos.length === 0) {
          return await sock.sendMessage(
            chatId,
            { text: '❌ No videos found!' },
            { quoted: message }
          );
        }

        const vid = videos[0];
        videoUrl = vid.url;
        searchTitle = vid.title;
        searchThumbnail = vid.thumbnail;
      }

      const validYT = videoUrl.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/
      );
      if (!validYT) {
        return await sock.sendMessage(chatId, { text: '❌ This is not a valid YouTube link!' }, { quoted: message });
      }

      if (searchThumbnail) {
        await sock.sendMessage(
          chatId,
          {
            image: { url: searchThumbnail },
            caption: `🎬 *${searchTitle}*\n⬇️ Downloading...`
          },
          { quoted: message }
        );
      }

      const data = await ytmp4(videoUrl);
     
      await sock.sendMessage(
        chatId,
        {
          video: { url: data.video },
          mimetype: 'video/mp4',
          fileName: `${data.title || searchTitle || 'video'}.mp4`,
          caption: `🎬 *${data.title}*\n👤 ${data.author}\n⏱️ ${data.duration}\n\n> *_Downloaded by MEGA-AI_*`
        },
        { quoted: message }
      );

    } catch (error) {
      console.error('[VIDEO] Command Error:', error);
      await sock.sendMessage(
        chatId,
        { text: `❌ Download failed!\nReason: ${error?.message || 'Unknown error'}` },
        { quoted: message }
      );
    }
  }
};
