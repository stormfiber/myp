import './config.js'
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  delay,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion
} from 'baileys'
import { Boom } from '@hapi/boom'
import P from 'pino'
import NodeCache from 'node-cache'
import qrcode from 'qrcode-terminal'
import { filesInit } from './lib/plugins.js'
import { handler } from './handler.js'
import Database from './lib/database.js'
import Helper from './lib/helper.js'

const logger = P({ level: global.logLevel })
const groupCache = new NodeCache({ stdTTL: 300, useClones: false })

// Initialize database
global.db = new Database('database.json', null, 2)

// Load database
await global.db._load()

// Default database structure
if (!global.db.data) {
  global.db.data = {
    users: {},
    chats: {},
    settings: {},
    stats: {}
  }
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const { version } = await fetchLatestBaileysVersion()

  const conn = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: Browsers.ubuntu(Firefox),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    syncFullHistory: global.syncFullHistory,
    markOnlineOnConnect: global.markOnlineOnConnect,
    getMessage: async (key) => {
      const msg = global.store?.messages?.[key.remoteJid]?.[key.id]
      return msg?.message || { conversation: '' }
    },
    cachedGroupMetadata: async (jid) => groupCache.get(jid)
  })

  conn.logger = logger

  // Store messages
  global.store = {
    messages: {}
  }

  conn.ev.on('messages.upsert', ({ messages }) => {
    messages.forEach((msg) => {
      if (msg.key.remoteJid) {
        if (!global.store.messages[msg.key.remoteJid]) {
          global.store.messages[msg.key.remoteJid] = {}
        }
        global.store.messages[msg.key.remoteJid][msg.key.id] = msg
      }
    })
  })

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

   /* if (qr) {
      console.log('\n📱 Scan this QR code with WhatsApp:\n')
      qrcode.generate(qr, { small: true })
      console.log('\n')
    } */
    if (qr) {
  const code = await conn.requestPairingCode('923051391007')
  console.log('Pairing code:', code)
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
          : true

      console.log('❌ Connection closed:', lastDisconnect?.error, '\n🔄 Reconnecting:', shouldReconnect)

      if (shouldReconnect) {
        await delay(3000)
        connectToWhatsApp()
      }
    } else if (connection === 'open') {
      console.log('✅ Connected to WhatsApp!')
      console.log('🤖 Bot is ready!\n')
      
      // Load plugins
      await filesInit(Helper.__dirname(import.meta) + '/plugins', filename => /\.js$/.test(filename), conn)
      console.log('🔌 Plugins loaded!\n')
    }
  })

  conn.ev.on('creds.update', saveCreds)

  // Handle group metadata
  conn.ev.on('groups.update', async (updates) => {
    for (const update of updates) {
      try {
        const metadata = await conn.groupMetadata(update.id)
        groupCache.set(update.id, metadata)
      } catch (e) {}
    }
  })

  // Initialize handler
  handler(conn)

  return conn
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...')
  await global.db.save()
  process.exit(0)
})

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err)
})

// Auto-save database
setInterval(async () => {
  if (global.db.data) await global.db.save()
}, 60000) // Every minute

console.log('🚀 Starting WhatsApp Bot...\n')
connectToWhatsApp().catch((err) => {
  console.error('❌ Failed to start:', err)
  process.exit(1)
})
