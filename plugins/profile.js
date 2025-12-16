import { xpRange } from '../lib/levelling.js'

let handler = async (m, { conn }) => {
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid
  const target = mentioned && mentioned[0] ? mentioned[0] : m.sender
  
  const user = global.db.data.users[target]
  if (!user) throw 'User not found in database!'
  
  const { min, max, xp } = xpRange(user.level, global.multiplier)
  const progress = Math.floor(((user.exp - min) / xp) * 100)
  
  const text = `
╭─────═[ *USER PROFILE* ]═─────⊷
┃
┃ ◈ *Name:* @${target.split('@')[0]}
┃ ◈ *Level:* ${user.level}
┃ ◈ *Role:* ${user.role}
┃ ◈ *XP:* ${user.exp}
┃ ◈ *Progress:* ${progress}%
┃
┃ ◈ *Premium:* ${user.premium ? '✅ Yes' : '❌ No'}
┃ ◈ *Diamond:* ${user.diamond ? '💎 Yes' : '❌ No'}
┃ ◈ *Limit:* ${user.limit}
┃
┃ ◈ *Registered:* ${user.registered ? '✅ Yes' : '❌ No'}
┃ ◈ *Banned:* ${user.banned ? '❌ Yes' : '✅ No'}
┃
╰──────────···
`.trim()

  await conn.sendMessage(m.chat, {
    text,
    mentions: [target]
  }, { quoted: m })
}

handler.help = ['profile']
handler.tags = ['info']
handler.command = ['profile', 'prof', 'me']

export default handler
