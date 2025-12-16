import { performance } from 'perf_hooks'

let handler = async (m, { conn }) => {
  const start = performance.now()
  
  const message = await conn.sendMessage(m.chat, {
    text: '⏳ Pinging...'
  }, { quoted: m })
  
  const end = performance.now()
  const ping = (end - start).toFixed(2)
  
  await conn.sendMessage(m.chat, {
    text: `🏓 *Pong!*\n\n` +
          `⚡ *Response Time:* ${ping}ms\n` +
          `⏰ *Uptime:* ${(process.uptime() / 60).toFixed(2)} minutes`,
    edit: message.key
  })
}

handler.help = ['ping']
handler.tags = ['info']
handler.command = ['ping', 'speed']

export default handler
