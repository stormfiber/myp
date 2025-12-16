let handler = async (m, { conn, usedPrefix, command }) => {
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid
  
  if (!mentioned || mentioned.length === 0) {
    throw `📌 *Usage:*\n\n` +
          `Mention user to remove premium:\n` +
          `*${usedPrefix + command} @user*`
  }
  
  const target = mentioned[0]
  const user = global.db.data.users[target]
  
  if (!user) throw 'User not found in database!'
  
  if (!user.premium) {
    throw `@${target.split('@')[0]} is not a premium user!`
  }
  
  user.premium = false
  
  await m.reply(
    `✅ *Premium Removed!*\n\n` +
    `@${target.split('@')[0]} is no longer a premium user!`,
    null,
    { mentions: [target] }
  )
}

handler.help = ['delprem']
handler.tags = ['owner']
handler.command = ['delprem', 'delpremium']

handler.owner = true

export default handler
