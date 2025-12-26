const CommandHandler = require('../lib/commandHandler');
const settings = require("../settings");
const fs = require('fs');
const path = require('path');

module.exports = {
  command: 'smenu',
  aliases: ['shelp', 'sh'],
  category: 'general',
  description: 'Interactive smart menu with live status',
  usage: '.smenu',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
      const thumbnail = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;

      const categories = Array.from(CommandHandler.categories.keys());
      const stats = CommandHandler.getDiagnostics();
      
      let menuText = `✨ *SMART MENU* ✨\n\n`;
      
      const topCmds = stats.slice(0, 3).filter(s => s.usage > 0);
      if (topCmds.length > 0) {
        menuText += `🔥 *HOT RIGHT NOW:*\n`;
        topCmds.forEach(c => menuText += ` ↳ .${c.command} (${c.usage} hits)\n`);
        menuText += `\n`;
      }

      for (const cat of categories) {
        menuText += `📂 *${cat.toUpperCase()}*\n`;
        const catCmds = CommandHandler.getCommandsByCategory(cat);
        
        catCmds.forEach(cmdName => {
          const isOff = CommandHandler.disabledCommands.has(cmdName.toLowerCase());
          const cmdStats = stats.find(s => s.command === cmdName.toLowerCase());
          const statusIcon = isOff ? '▪️' : '▫️';
          
          let speedTag = '';
          if (cmdStats) {
            const ms = parseFloat(cmdStats.average_speed);
            if (ms > 0 && ms < 100) speedTag = ' [⚡]';
            else if (ms > 1000) speedTag = ' [🐢]';
          }
          menuText += `  ${statusIcon} .${cmdName}${speedTag}\n`;
        });
        menuText += `\n`;
      }

      menuText += `📝 *Legend:*\n | ▫️Active | ▪️Disabled |\n| ⚡Fast | 🐢Heavy |`;

      await sock.sendMessage(chatId, {
        text: menuText,
        contextInfo: {
          externalAdReply: {
            title: `${settings.botName} v${settings.version}`,
            body: "The most optimized bot engine",
            thumbnail: thumbnail,
            sourceUrl: "https://github.com/GlobalTechInfo/MEGA-MD",
            mediaType: 1,
            showAdAttribution: true,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: message });

    } catch (error) {
      console.error('Menu Error:', error);
      await sock.sendMessage(chatId, { text: '❌ Failed to generate menu.' });
    }
  }
};

