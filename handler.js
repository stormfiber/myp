import { plugins } from './lib/plugins.js'
import { canLevelUp } from './lib/levelling.js'

const rateLimitMap = new Map()

export function handler(conn) {
  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      if (type !== 'notify') return 
      
      for (const m of messages) {
        if (!m.message) continue
        if (m.key.remoteJid === 'status@broadcast') continue
        if (m.key.fromMe) continue

        // --- 1. Enhanced Message Parsing (Fixes "Ignored" messages) ---
        m.conn = conn
        m.chat = m.key.remoteJid
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = m.isGroup ? m.key.participant : m.chat
        
        // Define safe reply function directly on the object
        m.reply = async (text) => {
             return await conn.sendMessage(m.chat, { text }, { quoted: m })
        }

        // Unwrap message (handle ephemeral/viewOnce)
        let msg = m.message
        if (msg.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message
        if (msg.viewOnceMessage) msg = msg.viewOnceMessage.message
        if (msg.ephemeralMessage) msg = msg.ephemeralMessage.message
        
        // Get text content safely
        const type = Object.keys(msg)[0]
        const text = (type === 'conversation' && msg.conversation) ? msg.conversation :
                     (type == 'imageMessage') && msg.imageMessage.caption ? msg.imageMessage.caption :
                     (type == 'videoMessage') && msg.videoMessage.caption ? msg.videoMessage.caption :
                     (type == 'extendedTextMessage') && msg.extendedTextMessage.text ? msg.extendedTextMessage.text : ''

        m.text = text
        m.pushName = m.pushName || 'User'

        // Log for debugging
        console.log(`[MSG] From: ${m.pushName} | Text: ${text.slice(0, 20)}...`)

        // Initialize database structure
        if (!global.db.data.users) global.db.data.users = {}
        if (!global.db.data.chats) global.db.data.chats = {}
        
        // Init User
        if (!global.db.data.users[m.sender]) {
          global.db.data.users[m.sender] = {
            exp: 0, level: 0, role: 'Novice',
            lastclaim: 0, registered: false,
            premium: false, diamond: false, banned: false,
            autolevelup: true, limit: global.limit || 100
          }
        }
        
        // Init Chat
        if (m.isGroup && !global.db.data.chats[m.chat]) {
          global.db.data.chats[m.chat] = {
            welcome: global.welcomeMessage || false,
            antilink: global.antiLink || false,
            isBanned: false
          }
        }
        
        const user = global.db.data.users[m.sender]
        const chat = global.db.data.chats[m.chat]
        
        if (user.banned || (chat && chat.isBanned)) continue

        // XP Gain
        if (!user.banned) {
          user.exp += Math.floor(Math.random() * 5) + 1
        }
        
        // Rate Limiting
        if (global.rateLimitEnabled) {
          const now = Date.now()
          const userLimit = rateLimitMap.get(m.sender) || { count: 0, timestamp: now }
          if (now - userLimit.timestamp > (global.rateLimitInterval || 60000)) {
            rateLimitMap.set(m.sender, { count: 1, timestamp: now })
          } else if (userLimit.count >= (global.rateLimitMax || 5)) {
            console.log(`⏳ Rate limited: ${m.sender}`)
            continue
          } else {
            userLimit.count++
            rateLimitMap.set(m.sender, userLimit)
          }
        }
        
        // Auto Read
        if (global.autoRead) await conn.readMessages([m.key])

        // --- 2. Command Handling ---
        const prefix = global.prefix || '.'
        const isCommand = (m.text || '').startsWith(prefix)
        
        if (isCommand) {
          const cmdText = m.text.slice(prefix.length).trim()
          const args = cmdText.split(/ +/)
          const command = args.shift().toLowerCase()
          
          m.command = command
          m.args = args
          
          let commandFound = false

          // Loop through plugins safely
          for (const plugin of Object.values(plugins)) {
             if (!plugin) continue

             // Normalize commands to array
             const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
             
             if (commands.includes(command)) {
                commandFound = true
                console.log(`[CMD] Executing ${command}`)

                // --- Permission Checks ---
                const senderNum = m.sender.split('@')[0]
                const isOwner = (global.owner || []).some(o => o === senderNum || o[0] === senderNum)
                const isPremium = (global.premium || []).includes(senderNum) || user.premium
                const isMod = (global.mods || []).includes(senderNum)

                if (plugin.owner && !isOwner) { await m.reply('❌ Owner only!'); continue }
                if (plugin.mods && !isMod && !isOwner) { await m.reply('❌ Moderator only!'); continue }
                if (plugin.premium && !isPremium && !isOwner) { await m.reply('❌ Premium only!'); continue }
                if (plugin.group && !m.isGroup) { await m.reply('❌ Group only!'); continue }
                if (plugin.private && m.isGroup) { await m.reply('❌ Private chat only!'); continue }

                if (plugin.admin || plugin.botAdmin) {
                    if (!m.isGroup) continue
                    const groupMetadata = await conn.groupMetadata(m.chat)
                    const participants = groupMetadata.participants
                    const userAdmin = participants.find(p => p.id === m.sender)?.admin
                    const botAdmin = participants.find(p => p.id === conn.user.id.split(':')[0] + '@s.whatsapp.net')?.admin

                    if (plugin.admin && !userAdmin && !isOwner) {
                         await m.reply('❌ Admin only!'); continue 
                    }
                    if (plugin.botAdmin && !botAdmin) {
                         await m.reply('❌ Bot must be Admin!'); continue 
                    }
                }

                // Execute Plugin
                try {
                    await plugin.default(m, {
                        conn,
                        text: args.join(' '),
                        args,
                        usedPrefix: prefix,
                        command,
                        isOwner,
                        isPremium,
                        isMod
                    })
                } catch (e) {
                    console.error(`Error executing ${command}:`, e)
                    await m.reply(`❌ Error: ${e.message}`)
                }
                break // Stop loop after finding command
             }
          }
          
          if (!commandFound) {
             console.log(`[CMD] Unknown command: ${command}`)
          }
        }

        /* Level Up Logic
        if (user.autolevelup) {
           // ... (Same as your existing logic)
        }
      }
    } catch (e) {
        console.error('❌ Handler Outer Error:', e)
    }
  })
}
 import { plugins } from './lib/plugins.js'
import { canLevelUp } from './lib/levelling.js'

const rateLimitMap = new Map()

export function handler(conn) {
  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      if (type !== 'notify') return // Only process new messages
      
      for (const m of messages) {
        if (!m.message) continue
        if (m.key.remoteJid === 'status@broadcast') continue
        if (m.key.fromMe) continue

        // Initialize message object
        m.conn = conn
        m.chat = m.key.remoteJid
        
        // Message info
        const isGroup = m.chat.endsWith('@g.us')
        m.sender = isGroup ? m.key.participant : m.chat
        m.isGroup = isGroup
        
        // Get message text
        const msg = m.message
        let text = ''
        const msgType = Object.keys(msg)[0]
        
        if (msg.conversation) {
          text = msg.conversation
        } else if (msg.extendedTextMessage?.text) {
          text = msg.extendedTextMessage.text
        } else if (msg.imageMessage?.caption) {
          text = msg.imageMessage.caption
        } else if (msg.videoMessage?.caption) {
          text = msg.videoMessage.caption
        }
        
        m.text = text
        m.pushName = m.pushName || 'User'
        
        // Initialize database if not exists
        if (!global.db.data.users) global.db.data.users = {}
        if (!global.db.data.chats) global.db.data.chats = {}
        
        // Initialize user in database
        if (!global.db.data.users[m.sender]) {
          global.db.data.users[m.sender] = {
            exp: 0,
            level: 0,
            role: 'Novice',
            lastclaim: 0,
            registered: false,
            premium: false,
            diamond: false,
            banned: false,
            autolevelup: true,
            limit: global.limit || 100
          }
        }
        
        // Initialize chat in database
        if (isGroup && !global.db.data.chats[m.chat]) {
          global.db.data.chats[m.chat] = {
            welcome: global.welcomeMessage,
            antilink: global.antiLink,
            isBanned: false
          }
        }
        
        const user = global.db.data.users[m.sender]
        const chat = global.db.data.chats[m.chat]
        
        // Check if user or chat is banned
        if (user.banned || (chat && chat.isBanned)) continue
        
        // Add XP for messaging (1-5 XP)
        if (!user.banned) {
          const xpGain = Math.floor(Math.random() * 5) + 1
          user.exp += xpGain
        }
        
        // Rate limiting
        if (global.rateLimitEnabled) {
          const now = Date.now()
          const userLimit = rateLimitMap.get(m.sender) || { count: 0, timestamp: now }
          
          if (now - userLimit.timestamp > global.rateLimitInterval) {
            rateLimitMap.set(m.sender, { count: 1, timestamp: now })
          } else if (userLimit.count >= global.rateLimitMax) {
            console.log(`⏳ Rate limited: ${m.sender}`)
            continue
          } else {
            userLimit.count++
            rateLimitMap.set(m.sender, userLimit)
          }
        }
        
        // Auto read
        if (global.autoRead) {
          await conn.readMessages([m.key])
        }
        
        // Parse command
        m.args = []
        m.command = null
        
        const prefixRegex = new RegExp(`^[${global.prefix.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')}]`)
        const isCommand = prefixRegex.test(text)
        
        if (isCommand && text) {
          const cmdText = text.slice(global.prefix.length).trim()
          const args = cmdText.split(/ +/)
          const cmdName = args.shift()?.toLowerCase()
          
          m.command = cmdName
          m.args = args
          
          // Auto typing
          if (global.autoTyping) {
            await conn.sendPresenceUpdate('composing', m.chat)
          }
          
          // Find and execute plugin
          for (const name in plugins) {
            const plugin = plugins[name]
            if (!plugin || !plugin.default) continue
            
            // Check if command matches
            const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
            if (!commands.includes(m.command)) continue
            
            // Permission checks
            const senderNum = m.sender.split('@')[0]
            const isOwner = global.owner.includes(senderNum)
            const isPremium = global.premium.includes(senderNum) || user.premium
            const isDiamond = global.diamond.includes(senderNum) || user.diamond
            const isMod = global.mods.includes(senderNum)
            
            // Owner only
            if (plugin.owner && !isOwner) {
              await m.reply('❌ This command is only for the bot owner!')
              continue
            }
            
            // Mod only (owner + mods)
            if (plugin.mods && !isOwner && !isMod) {
              await m.reply('❌ This command is only for moderators!')
              continue
            }
            
            // Premium only
            if (plugin.premium && !isPremium && !isOwner) {
              await m.reply('❌ This command is only for premium users!')
              continue
            }
            
            // Diamond only
            if (plugin.diamond && !isDiamond && !isOwner) {
              await m.reply('❌ This command is only for diamond users!')
              continue
            }
            
            // Group only
            if (plugin.group && !isGroup) {
              await m.reply('❌ This command can only be used in groups!')
              continue
            }
            
            // Private only
            if (plugin.private && isGroup) {
              await m.reply('❌ This command can only be used in private chat!')
              continue
            }
            
            // Admin only (group admin)
            if (plugin.admin && isGroup) {
              const metadata = await conn.groupMetadata(m.chat)
              const participant = metadata.participants.find(p => p.id === m.sender)
              const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin'
              
              if (!isAdmin && !isOwner) {
                await m.reply('❌ This command is only for group admins!')
                continue
              }
            }
            
            // Bot admin check
            if (plugin.botAdmin && isGroup) {
              const metadata = await conn.groupMetadata(m.chat)
              const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net'
              const botParticipant = metadata.participants.find(p => p.id === botNumber)
              const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'
              
              if (!isBotAdmin) {
                await m.reply('❌ Bot needs to be admin to use this command!')
                continue
              }
            }
            
            try {
              await plugin.default(m, {
                conn,
                text: m.args.join(' '),
                args: m.args,
                usedPrefix: global.prefix,
                command: m.command,
                isOwner,
                isPremium,
                isDiamond,
                isMod
              })
              
              // Add XP for using commands (only if not owner command)
              if (!plugin.owner) {
                const xpGain = Math.floor(Math.random() * 10) + 5
                user.exp += xpGain
              }
            } catch (error) {
              console.error(`❌ Error in plugin ${name}:`, error)
              const errorMsg = typeof error === 'string' ? error : error.message || 'An error occurred'
              await m.reply(`❌ ${errorMsg}`)
            }
            
            break
          }
        }
        */

        // Level up handler
        if (user.autolevelup) {
          const before = user.level * 1
          while (canLevelUp(user.level, user.exp, global.multiplier)) {
            user.level++
          }
          user.role = global.rpg.role(user.level).name
          
          if (before !== user.level) {
            await m.reply(`
🎉 *LEVEL UP!*

Level: *${before}* ➜ *${user.level}*
Role: *${user.role}*
XP: *${user.exp}*

Keep chatting to level up more! 💪
`.trim())
          }
        }
        
        // Run before handlers from plugins
        for (const name in plugins) {
          const plugin = plugins[name]
          if (plugin.before) {
            try {
              await plugin.before(m, { conn })
            } catch (e) {
              console.error(`Error in before handler ${name}:`, e)
            }
          }
        }
        
        // Auto reply
        if (global.autoReply && text && !isCommand) {
          const lowerText = text.toLowerCase()
          for (const [keyword, reply] of Object.entries(global.autoReplyKeywords)) {
            if (lowerText.includes(keyword)) {
              await m.reply(reply)
              break
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Handler error:', error)
    }
  })
  
  // Group participants update
  conn.ev.on('group-participants.update', async ({ id, participants, action }) => {
    try {
      if (!global.welcomeMessage && action === 'add') return
      
      const metadata = await conn.groupMetadata(id)
      const chat = global.db.data.chats?.[id]
      
      if (!chat || !chat.welcome) return
      
      for (const participant of participants) {
        if (action === 'add') {
          const text = global.welcomeText.replace('@user', `@${participant.split('@')[0]}`)
          await conn.sendMessage(id, { text, mentions: [participant] })
        } else if (action === 'remove') {
          const text = global.byeText.replace('@user', `@${participant.split('@')[0]}`)
          await conn.sendMessage(id, { text, mentions: [participant] })
        }
      }
    } catch (error) {
      console.error('❌ Group participants error:', error)
    }
  })
  
  // Anti-call
  if (global.antiCall) {
    conn.ev.on('call', async (calls) => {
      for (const call of calls) {
        if (call.status === 'offer') {
          await conn.rejectCall(call.id, call.from)
          await conn.sendMessage(call.from, {
            text: '❌ Calls are not allowed. Please send a text message instead.'
          })
        }
      }
    })
  }
}

// Helper function for m.reply
if (!Object.prototype.reply) {
  Object.defineProperty(Object.prototype, 'reply', {
    value: async function (text) {
      return await this.conn.sendMessage(this.chat, { text }, { quoted: this })
    },
    writable: true,
    configurable: true
  })
}
