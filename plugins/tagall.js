let handler = async (m, { conn, text, usedPrefix, command }) => {
  const metadata = await conn.groupMetadata(m.chat)
  const participants = metadata.participants.map(p => p.id)
  
  const message = text || 'Attention everyone!'
  
  let mentionText = `📢 *${message}*\n\n`
  participants.forEach((jid, i) => {
    mentionText += `${i + 1}. @${jid.split('@')[0]}\n`
  })
  mentionText += `\n_Total: ${participants.length} members_`
  
  await conn.sendMessage(m.chat, {
    text: mentionText,
    mentions: participants
  }, { quoted: m })
}

handler.help = ['tagall']
handler.tags = ['group']
handler.command = ['tagall', 'everyone']

handler.group = true
handler.admin = true

export default handler
