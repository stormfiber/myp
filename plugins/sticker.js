import { downloadMediaMessage } from 'baileys'
import sharp from 'sharp'

let handler = async (m, { conn, usedPrefix, command }) => {
  try {
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const msg = quoted || m.message
    
    if (!msg?.imageMessage && !msg?.videoMessage) {
      throw `📌 *Usage:*\n\n` +
            `Reply to an image or video with:\n` +
            `*${usedPrefix + command}*\n\n` +
            `_You can also add text:_\n` +
            `*${usedPrefix + command} pack | author*`
    }
    
    await m.reply('⏳ Creating sticker...')
    
    // Get pack and author from args
    const text = m.args.join(' ')
    const [pack, author] = text ? text.split('|').map(s => s.trim()) : [global.packname, global.authorSticker]
    
    // Download media
    const buffer = await downloadMediaMessage(
      { message: msg },
      'buffer',
      {}
    )
    
    let stickerBuffer
    
    if (msg.imageMessage) {
      // Process image
      stickerBuffer = await sharp(buffer)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp()
        .toBuffer()
    } else if (msg.videoMessage) {
      // For video stickers (animated), just resize
      // Note: Full video processing requires ffmpeg
      stickerBuffer = await sharp(buffer)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 80 })
        .toBuffer()
    }
    
    // Send sticker
    await conn.sendMessage(m.chat, {
      sticker: stickerBuffer,
      mimetype: 'image/webp'
    }, { quoted: m })
    
  } catch (error) {
    throw error.message || error
  }
}

handler.help = ['sticker', 's']
handler.tags = ['media']
handler.command = ['sticker', 's', 'stiker']

export default handler
