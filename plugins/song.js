const yts = require('yt-search');
const { ytmp3 } = require('ruhend-scraper');

module.exports = {
  command: 'song',
  aliases: ['music', 'audio', 'mp3'],
  category: 'music',
  description: 'Download song from YouTube (MP3)',
  usage: '.song <song name | youtube link>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ').trim();

    if (!query) {
      return await sock.sendMessage(chatId, { text: '🎵 *Song Downloader*\n\nUsage:\n.song <song name | YouTube link>' }, { quoted: message });
    }

    try {
      let video;

      if (query.includes('youtube.com') || query.includes('youtu.be')) {
        video = { url: query };
      } else {
        const search = await yts(query);
        if (!search?.videos?.length) {
          return await sock.sendMessage(chatId, { text: '❌ No results found.' }, { quoted: message });
        }
        video = search.videos[0];
      }

      if (video.thumbnail) {
        await sock.sendMessage(chatId, { image: { url: video.thumbnail }, caption: `🎶 *${video.title}*\n⏱ ${video.timestamp || 'Unknown'}\n\nDownloading...` }, { quoted: message });
      }

      const data = await ytmp3(video.url);
      
      const audioUrl = data.audio_2 || data.audio;

      await sock.sendMessage(chatId, { 
        audio: { url: audioUrl }, 
        mimetype: 'audio/mpeg', 
        fileName: `${data.title || video.title || 'song'}.mp3`, 
        ptt: false 
      }, { quoted: message });

    } catch (err) {
      console.error('Song plugin error:', err);
      await sock.sendMessage(chatId, { text: '❌ Failed to download song. Please try again later.' }, { quoted: message });
    }
  }
};
