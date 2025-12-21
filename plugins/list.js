/*****************************************************************************
 *                                                                           *
 *                     Developed By Qasim Ali                                *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/GlobalTechInfo                         *
 *  ▶️  YouTube  : https://youtube.com/@GlobalTechInfo                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VagJIAr3bbVBCpEkAM07     *
 *                                                                           *
 *    © 2026 GlobalTechInfo. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the MEGA-MD Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/


const settings = require('../settings');
const commandHandler = require('../lib/commandHandler');
const path = require('path');
const fs = require('fs');

const menuStyles = [
  {
    render({ title, info, categories, prefix }) {
      let t = `╭━━『 *MEGA MENU* 』━⬣\n`;
      t += `┃ ✨ *Bot: ${info.bot}*\n`;
      t += `┃ 🔧 *Prefix: ${info.prefix}*\n`;
      t += `┃ 📦 *Plugins: ${info.total}*\n`;

      for (const [cat, cmds] of categories) {
        t += `┃\n┃━━━ *${cat.toUpperCase()}* ━✦\n`;
        for (const c of cmds)
          t += `┃ ➤ ${prefix}${c}\n`;
      }
      t += `╰━━━━━━━━━━━━━⬣`;
      return t;
    }
  },

  {
    render({ title, info, categories, prefix }) {
      let t = `◈╭─❍「 *MEGA MENU* 」❍\n`;
      t += `◈├• ✨ *Bot: ${info.bot}*\n`;
      t += `◈├• 🔧 *Prefix: ${info.prefix}*\n`;
      t += `◈├• 📦 *Plugins: ${info.total}*\n`;

      for (const [cat, cmds] of categories) {
        t += `◈├─❍「 *${cat.toUpperCase()}* 」❍\n`;
        for (const c of cmds)
          t += `◈├• ${prefix}${c}\n`;
      }
      t += `◈╰──★─☆──♪♪─❍`;
      return t;
    }
  },

  {
    render({ title, info, categories, prefix }) {
      let t = `┏━━━━ *MEGA MENU* ━━━┓\n`;
      t += `┃• *Bot: ${info.bot}*\n`;
      t += `┃• *Prefix : ${info.prefix}*\n`;
      t += `┃• *Plugins : ${info.total}*\n`;

      for (const [cat, cmds] of categories) {
        t += `┃\n┃━━━━ *${cat.toUpperCase()}* ━━◆\n`;
        for (const c of cmds)
          t += `┃ ▸ ${prefix}${c}\n`;
      }
      t += `┗━━━━━━━━━━━━━━━┛`;
      return t;
    }
  },

  {
    render({ title, info, categories, prefix }) {
      let t = `✦═══ *MEGA MENU* ═══✦\n`;
      t += `║➩ *Bot: ${info.bot}*\n`;
      t += `║➩ *Prefix: ${info.prefix}*\n`;
      t += `║➩ *Plugins: ${info.total}*\n`;

      for (const [cat, cmds] of categories) {
        t += `║\n║══ *${cat.toUpperCase()}* ══✧\n`;
        for (const c of cmds)
          t += `║ ✦ ${prefix}${c}\n`;
      }
      t += `✦══════════════✦`;
      return t;
    }
  },

  {
    render({ title, info, categories, prefix }) {
      let t = `❀━━━ *MEGA MENU* ━━━❀\n`;
      t += `┃☞ *Bot: ${info.bot}*\n`;
      t += `┃☞ *Prefix: ${info.prefix}*\n`;
      t += `┃☞ *Plugins: ${info.total}*\n`;

      for (const [cat, cmds] of categories) {
        t += `┃━━━〔 *${cat.toUpperCase()}* 〕━❀\n`;
        for (const c of cmds)
          t += `☞ ${prefix}${c}\n`;
      }
      t += `❀━━━━━━━━━━━━━━❀`;
      return t;
    }
  },

  {
    render({ title, info, categories, prefix }) {
      let t = `◆━━━ *MEGA MENU* ━━━◆\n`;
      for (const [cat, cmds] of categories) {
        t += `┃\n┃━━ *${cat.toUpperCase()}* ━━◆◆\n`;
        for (const c of cmds)
          t += `┃ ¤ ${prefix}${c}\n`;
      }
      t += `◆━━━━━━━━━━━━━━━━◆`;
      return t;
    }
  },

  {
    render({ title, info, categories, prefix }) {
      let t = `╭───⬣ *MEGA MENU* ──⬣\n`;
      for (const [cat, cmds] of categories) {
        t += ` |\n |───⬣ *${cat.toUpperCase()}* ──⬣\n`;
        for (const c of cmds)
          t += ` | ● ${prefix}${c}\n`;
      }
      t += `╰──────────⬣`;
      return t;
    }
  }
];

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

module.exports = {
  command: 'menu',
  aliases: ['help', 'commands', 'h', 'list'],
  category: 'general',
  description: 'Show all commands',
  usage: '.menu [command]',

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const prefix = settings.prefixes[0];
    const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

    if (args.length) {
      const searchTerm = args[0].toLowerCase();
      
      let cmd = commandHandler.commands.get(searchTerm);
      
      if (!cmd && commandHandler.aliases.has(searchTerm)) {
        const mainCommand = commandHandler.aliases.get(searchTerm);
        cmd = commandHandler.commands.get(mainCommand);
      }
      
      if (!cmd) {
        return sock.sendMessage(chatId, { 
          text: `❌ Command "${args[0]}" not found.\n\nUse ${prefix}menu to see all commands.`,
          ...channelInfo
        }, { quoted: message });
      }

      const text = 
`╭━━━━━━━━━━━━━━⬣
┃ 📌 *COMMAND INFO*
┃
┃ ⚡ *Command:* ${prefix}${cmd.command}
┃ 📝 *Desc:* ${cmd.description || 'No description'}
┃ 📖 *Usage:* ${cmd.usage || `${prefix}${cmd.command}`}
┃ 🏷️ *Category:* ${cmd.category || 'misc'}
┃ 🔖 *Aliases:* ${cmd.aliases?.length ? cmd.aliases.map(a => prefix + a).join(', ') : 'None'}
┃
╰━━━━━━━━━━━━━━⬣`;

      if (fs.existsSync(imagePath)) {
        return sock.sendMessage(chatId, {
          image: { url: imagePath },
          caption: text,
          ...channelInfo
        }, { quoted: message });
      }

      return sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });
    }

    const style = pick(menuStyles);

    const text = style.render({
      title: settings.packname,
      prefix,
      info: {
        bot: settings.packname,
        prefix: settings.prefixes.join(', '),
        total: commandHandler.commands.size
      },
      categories: commandHandler.categories
    });

    if (fs.existsSync(imagePath)) {
      await sock.sendMessage(chatId, {
        image: { url: imagePath },
        caption: text,
        ...channelInfo
      }, { quoted: message });
    } else {
      await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });
    }
  }
};

/*****************************************************************************
 *                                                                           *
 *                     Developed By Qasim Ali                                *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/GlobalTechInfo                         *
 *  ▶️  YouTube  : https://youtube.com/@GlobalTechInfo                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VagJIAr3bbVBCpEkAM07     *
 *                                                                           *
 *    © 2026 GlobalTechInfo. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the MEGA-MD Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/
