import { plugins } from '../lib/plugins.js'

let handler = async (m, { conn, usedPrefix, command, isOwner }) => {
  const user = global.db.data.users[m.sender]
  const chat = global.db.data.chats[m.chat]
  
  // Group commands by category
  const categories = {}
  
  for (const name in plugins) {
    const plugin = plugins[name]
    if (!plugin || !plugin.help) continue
    
    const tags = Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags || 'misc']
    
    for (const tag of tags) {
      if (!categories[tag]) categories[tag] = []
      categories[tag].push(plugin.help)
    }
  }
  
  let menuText = `
╭─────═[ *BOT INFO* ]═─────⊷
┃
┃ ◈ *Bot:* ${global.botName}
┃ ◈ *Prefix:* [ ${usedPrefix} ]
┃ ◈ *Level:* ${user.level}
┃ ◈ *Role:* ${user.role}
┃ ◈ *XP:* ${user.exp}
┃ ◈ *Premium:* ${user.premium ? '✅' : '❌'}
┃
╰──────────···

╭─────═[ *USER INFO* ]═─────⊷
┃
┃ ◈ *Name:* ${m.pushName || 'User'}
┃ ◈ *Number:* @${m.sender.split('@')[0]}
┃ ◈ *Limit:* ${user.limit}
┃
╰──────────···
`.trim()

  const categoryEmoji = {
    'general': '📋',
    'ai': '🤖',
    'downloader': '📥',
    'media': '🎨',
    'group': '👥',
    'owner': '👑',
    'premium': '💎',
    'game': '🎮',
    'fun': '🎉',
    'tools': '🔧',
    'info': 'ℹ️',
    'misc': '📦'
  }

  for (const category in categories) {
    const emoji = categoryEmoji[category.toLowerCase()] || '📌'
    menuText += `\n\n╭─────═[ ${emoji} *${category.toUpperCase()}* ]═─────⊷\n┃\n`
    
    for (const help of categories[category]) {
      const commands = Array.isArray(help) ? help : [help]
      menuText += `┃ ◈ ${usedPrefix}${commands[0]}\n`
    }
    
    menuText += `╰──────────···`
  }
  
  menuText += `\n\n*💡 Tip:* Type ${usedPrefix}help <command> for more info about a command`
  
  await conn.sendMessage(m.chat, {
    text: menuText,
    mentions: [m.sender]
  }, { quoted: m })
}

handler.help = ['menu', 'help']
handler.tags = ['general']
handler.command = ['menu', 'help', 'commands']

export default handler
