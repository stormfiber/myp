module.exports = {
  command: 'whoami',
  aliases: [],
  category: 'utility',
  description: 'Shows your display name, phone number, and profile picture.',
  usage: '.whoami',

  async handler(sock, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const number = senderId.split('@')[0];
    const displayName = message.pushName || number;

    const text = `👤 Name: ${displayName}\n📱 Number: ${number}`;

    try {
      // Fetch profile picture
      const profilePicUrl = await sock.profilePictureUrl(senderId).catch(() => null);

      if (profilePicUrl) {
        await sock.sendMessage(message.key.remoteJid, {
          image: { url: profilePicUrl },
          caption: text
        }, { quoted: message });
      } else {
        // fallback to text only if no profile picture
        await sock.sendMessage(message.key.remoteJid, { text }, { quoted: message });
      }
    } catch (err) {
      console.error('WhoAmI Error:', err);
      await sock.sendMessage(message.key.remoteJid, { text }, { quoted: message });
    }
  }
};
