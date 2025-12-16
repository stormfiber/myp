let handler = async (m, { conn, usedPrefix, command }) => {
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid
  
  if (!mentioned || mentioned.length === 0) {
    throw `📌 *Usage:*\n\n` +
          `Mention user(s) to kick:\n` +
          `*${usedPrefix + command} @user*\n\n` +
          `Or reply to their message with:\n` +
          `*${usedPrefix + command}*`
  }
  
  try {
    await conn.groupParticipantsUpdate(m.chat, mentioned, 'remove')
    await m.reply(`✅ Successfully removed ${mentioned.length} user(s)!`)
  } catch (error) {
    throw `❌ Failed to remove user(s): ${error.message}`
  }
}

handler.help = ['kick']
handler.tags = ['group']
handler.command = ['kick', 'remove']

handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
