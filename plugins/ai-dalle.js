import fetch from 'node-fetch'
import uploadImage from '../lib/uploadImage.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    throw `*This command generates images from text prompts*\n\n` +
          `*📝 Example usage:*\n` +
          `◉ ${usedPrefix + command} Beautiful anime girl\n` +
          `◉ ${usedPrefix + command} Elon Musk in pink outfit\n` +
          `◉ ${usedPrefix + command} Futuristic city at sunset`
  }

  try {
    await m.reply('*⏳ Please wait, generating image...*')

    const endpoint = `https://api.gurusensei.workers.dev/dream?prompt=${encodeURIComponent(text)}`
    const response = await fetch(endpoint)

    if (response.ok) {
      const imageBuffer = await response.buffer()
      let imgurl = await uploadImage(imageBuffer)
      
      await conn.sendMessage(m.chat, {
        image: { url: imgurl },
        caption: `✨ *Generated Image*\n\n📝 Prompt: ${text}\n\n${global.author}`
      }, { quoted: m })
    } else {
      throw '*Image generation failed*'
    }
  } catch (error) {
    throw '*Oops! Something went wrong while generating image. Please try again later.*'
  }
}

handler.help = ['dalle']
handler.tags = ['ai']
handler.command = ['dalle', 'gen', 'imagine', 'openai2']

handler.premium = true

export default handler
