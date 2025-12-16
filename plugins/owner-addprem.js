let handler = async (m, { conn, usedPrefix, command }) => {
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid
  
  if (!mentioned || mentioned.length === 0) {
    throw `📌 *Usage:*\n\n` +
          `Mention user to add premium:\n` +
          `*${usedPrefix + command} @user*`
  }
  
  const target = mentioned[0]
  const user = global.db.data.users[target]
  
  if (!user) throw 'User not found in database!'
  
  if (user.premium) {
    throw `@${target.split('@')[0]} is already a premium user!`
  }
  
  user.premium = true
  user.limit = user.limit + 100 // Bonus limits for premium
  
  await m.reply(
    `✅ *Premium Added!*\n\n` +
    `@${target.split('@')[0]} is now a premium user!\n` +
    `Bonus: +100 limits`,
    null,
    { mentions: [target] }
  )
}

handler.help = ['addprem']
handler.tags = ['owner']
handler.command = ['addprem', 'addpremium']

handler.owner = true

export default handler
