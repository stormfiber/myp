import { xpRange } from '../lib/levelling.js'

let handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender]
  const { min, max, xp } = xpRange(user.level, global.multiplier)
  const progress = Math.floor(((user.exp - min) / xp) * 100)
  
  const text = `
╭─────═[ *LEVEL INFO* ]═─────⊷
┃
┃ ◈ *Name:* ${m.pushName || 'User'}
┃ ◈ *Level:* ${user.level}
┃ ◈ *Role:* ${user.role}
┃
┃ ◈ *XP:* ${user.exp - min} / ${xp}
┃ ◈ *Total XP:* ${user.exp}
┃ ◈ *Progress:* ${progress}%
┃
┃ ◈ *Needed XP:* ${max - user.exp}
┃
╰──────────···

*Keep chatting to level up!* 💪
`.trim()

  await conn.sendMessage(m.chat, {
    text,
    mentions: [m.sender]
  }, { quoted: m })
}

handler.help = ['level', 'rank']
handler.tags = ['info']
handler.command = ['level', 'rank', 'lvl']

export default handler
