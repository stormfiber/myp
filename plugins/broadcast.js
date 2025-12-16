let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    throw `📌 *Usage:*\n\n` +
          `Send broadcast message to all groups:\n` +
          `*${usedPrefix + command} <message>*\n\n` +
          `*Example:*\n` +
          `${usedPrefix + command} Bot will restart in 5 minutes!`
  }
  
  try {
    await m.reply('📢 Broadcasting message to all groups...')
    
    const chats = await conn.groupFetchAllParticipating()
    const groups = Object.keys(chats)
    
    let success = 0
    let failed = 0
    
    for (const groupId of groups) {
      try {
        await conn.sendMessage(groupId, {
          text: `📢 *BROADCAST MESSAGE*\n\n${text}\n\n_From: ${global.botName}_`
        })
        success++
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2s delay
      } catch (error) {
        failed++
        console.error(`Failed to send to ${groupId}:`, error)
      }
    }
    
    await m.reply(
      `✅ *Broadcast Complete!*\n\n` +
      `✓ Success: ${success}\n` +
      `✗ Failed: ${failed}\n` +
      `📊 Total Groups: ${groups.length}`
    )
  } catch (error) {
    throw `❌ Broadcast failed: ${error.message}`
  }
}

handler.help = ['broadcast']
handler.tags = ['owner']
handler.command = ['broadcast', 'bc']

handler.owner = true

export default handler
