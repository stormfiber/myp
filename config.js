import { config } from 'dotenv'
config()

// Bot Configuration
global.botName = process.env.BOT_NAME || 'WhatsApp Bot'
global.prefix = process.env.PREFIX || '!'
global.author = process.env.AUTHOR || 'Bot Author'

// Owner numbers (without + and @s.whatsapp.net)
global.owner = (process.env.OWNER_NUMBERS || '923051391007').split(',').map(num => num.trim())

// Premium users
global.premium = (process.env.PREMIUM_USERS || '').split(',').map(num => num.trim()).filter(Boolean)

// Diamond users (highest tier)
global.diamond = (process.env.DIAMOND_USERS || '').split(',').map(num => num.trim()).filter(Boolean)

// Connection settings
global.logLevel = process.env.LOG_LEVEL || 'silent'
global.syncFullHistory = process.env.SYNC_FULL_HISTORY === 'true'
global.markOnlineOnConnect = process.env.MARK_ONLINE_ON_CONNECT === 'true'

// Feature flags
global.autoRead = process.env.AUTO_READ === 'false'
global.autoTyping = process.env.AUTO_TYPING === 'false'
global.welcomeMessage = process.env.WELCOME_MESSAGE === 'false'
global.antiLink = process.env.ANTI_LINK === 'true'
global.autoReply = process.env.AUTO_REPLY === 'false'
global.antiCall = process.env.ANTI_CALL === 'false'

// Leveling system
global.multiplier = parseInt(process.env.MULTIPLIER) || 1000

// RPG roles based on level
global.rpg = {
  role: (level) => {
    level = parseInt(level)
    if (level >= 100) return { name: '🔱 Immortal Emperor', level: 100 }
    if (level >= 90) return { name: '👑 Supreme King', level: 90 }
    if (level >= 80) return { name: '⚡ Thunder Lord', level: 80 }
    if (level >= 70) return { name: '🌟 Celestial Master', level: 70 }
    if (level >= 60) return { name: '🗡️ Legendary Warrior', level: 60 }
    if (level >= 50) return { name: '💎 Diamond Knight', level: 50 }
    if (level >= 40) return { name: '🏆 Elite Champion', level: 40 }
    if (level >= 30) return { name: '⚔️ War General', level: 30 }
    if (level >= 20) return { name: '🛡️ Knight', level: 20 }
    if (level >= 10) return { name: '🗡️ Warrior', level: 10 }
    if (level >= 5) return { name: '🔰 Adventurer', level: 5 }
    return { name: '🌱 Novice', level: 0 }
  }
}

// Rate limiting
global.rateLimitEnabled = process.env.RATE_LIMIT_ENABLED === 'true'
global.rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_MESSAGES) || 10
global.rateLimitInterval = parseInt(process.env.RATE_LIMIT_INTERVAL) || 60000

// Auto reply keywords
global.autoReplyKeywords = {
  'hello': 'Hello! 👋 How can I help you?',
  'hi': 'Hi there! 👋',
  'help': `Type *${global.prefix}menu* to see all commands!`,
  'bot': `Yes, I'm a bot! Type *${global.prefix}menu* to see what I can do.`
}

// Welcome message template
global.welcomeText = '👋 Welcome @user!\nEnjoy your stay in the group!'
global.byeText = '👋 Goodbye @user!\nWe hope to see you again!'

// API Configuration
global.APIs = {
  // Add your API endpoints here
  nrtm: 'https://nurutomo.herokuapp.com',
  bg: 'http://bochil.ddns.net',
  xteam: 'https://api.xteam.xyz',
  zahir: 'https://zahirr-web.herokuapp.com',
  zeks: 'https://api.zeks.xyz',
  pencarikode: 'https://pencarikode.xyz',
  LeysCoder: 'https://leyscoders-api.herokuapp.com',
  neoxr: 'https://neoxr-api.herokuapp.com',
  amel: 'https://melcanz.com',
  hardianto: 'https://hardianto.xyz',
  lol: 'https://api.lolhuman.xyz'
}

// API Keys
global.APIKeys = {
  'https://api.xteam.xyz': process.env.XTEAM_API_KEY || '',
  'https://zahirr-web.herokuapp.com': process.env.ZAHIR_API_KEY || '',
  'https://api.zeks.xyz': process.env.ZEKS_API_KEY || '',
  'https://pencarikode.xyz': process.env.PENCARIKODE_API_KEY || '',
  'https://leyscoders-api.herokuapp.com': process.env.LEYSCODER_API_KEY || '',
  'https://neoxr-api.herokuapp.com': process.env.NEOXR_API_KEY || '',
  'https://melcanz.com': process.env.AMEL_API_KEY || '',
  'https://api.lolhuman.xyz': process.env.LOLHUMAN_API_KEY || ''
}

// Sticker metadata
global.packname = process.env.PACK_NAME || '🤖 Bot Sticker'
global.authorSticker = process.env.STICKER_AUTHOR || global.author

// Group settings
global.groupMaxMentions = 5
global.groupAllowMedia = true

// Limits and economy (optional for future use)
global.limit = 100 // Default daily limit
global.diamond = 0 // Premium currency

// Mods (moderators - can use some owner commands)
global.mods = (process.env.MODS || '').split(',').map(num => num.trim()).filter(Boolean)

// Prems (premium users list - kept for compatibility)
global.prems = global.premium

console.log('✅ Configuration loaded!')
