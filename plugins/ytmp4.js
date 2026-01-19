const { ytmp4 } = require('ruhend-scraper');

function isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
}

module.exports = {
  command: 'ytvid',
  aliases: ['ytvideo', 'ytdl'],
  category: 'download',
  description: 'Download YouTube videos',
  usage: '.ytvid <youtube url>',
  
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      if (args.length === 0) {
        return await sock.sendMessage(chatId, {
          text: "*YouTube Video Downloader*\n\n*Usage:*\n`.ytvid <url>`"
        }, { quoted: message });
      }

      const url = args[0];

      if (!isValidYouTubeUrl(url)) {
        return await sock.sendMessage(chatId, {
          text: "*Invalid YouTube URL!*"
        }, { quoted: message });
      }

      const data = await ytmp4(url);
     
      await sock.sendMessage(chatId, {
        video: { url: data.video },
        caption: `🎬 *${data.title}*\n👤 ${data.author}\n⏱️ ${data.duration}`,
        mimetype: 'video/mp4',
        fileName: `${data.title}.mp4`
      }, { quoted: message });

    } catch (error) {
      console.error('YT Download Error:', error);
      await sock.sendMessage(chatId, { text: "❌ Download failed!" }, { quoted: message });
    }
  }
};
