import fs from 'fs'
import { promises as fsPromises } from 'fs'
import { join } from 'path'

const MAX_MESSAGES = 50
const STORE_FILE = 'store.json'
const state = {
    chats: {},
    contacts: {},
    messages: {}
}

/**
 * Custom Store implementation compatible with Baileys
 * Supports MongoDB (via global.db or mongoose) and JSON file fallback
 */
const makeStore = (logger) => {
    const loadFromFile = async () => {
        try {
            if (fs.existsSync(STORE_FILE)) {
                const data = JSON.parse(await fsPromises.readFile(STORE_FILE, 'utf-8'))
                Object.assign(state, data)
                logger?.info(`Store loaded from ${STORE_FILE}`)
            }
        } catch (error) {
            logger?.error({ error }, 'Failed to load store from file')
        }
    }
    const loadFromDb = async () => {
        try {
            if (global.db?.data?.store) {
                Object.assign(state, global.db.data.store)
                logger?.info('Store loaded from MongoDB')
                return true
            }
            return false
        } catch (error) {
            logger?.error({ error }, 'Failed to load store from DB')
            return false
        }
    }
    const init = async () => {
        const dbSuccess = await loadFromDb()
        if (!dbSuccess) {
            await loadFromFile()
        }
    }
    const save = async () => {
        try {
            cleanup()
            if (global.db?.data) {
                global.db.data.store = state
            }
            await fsPromises.writeFile(STORE_FILE, JSON.stringify(state))
            
        } catch (error) {
            logger?.error({ error }, 'Failed to save store')
        }
    }
    const cleanup = () => {
        for (const jid in state.messages) {
            const msgs = state.messages[jid]
            if (Array.isArray(msgs) && msgs.length > MAX_MESSAGES) {
                state.messages[jid] = msgs.slice(-MAX_MESSAGES)
            }
        }
    }

    return {
        state,
        init,
        save,
        bind(ev) {
            ev.on('contacts.set', ({ contacts }) => {
                contacts.forEach(contact => {
                    state.contacts[contact.id] = contact
                })
            })

            ev.on('contacts.upsert', (contacts) => {
                contacts.forEach(contact => {
                    state.contacts[contact.id] = {
                        ...(state.contacts[contact.id] || {}),
                        ...contact
                    }
                })
            })

            ev.on('contacts.update', (updates) => {
                updates.forEach(update => {
                    if (state.contacts[update.id]) {
                        Object.assign(state.contacts[update.id], update)
                    }
                })
            })
            ev.on('chats.set', ({ chats }) => {
                chats.forEach(chat => {
                    state.chats[chat.id] = chat
                })
            })

            ev.on('chats.upsert', (chats) => {
                chats.forEach(chat => {
                    state.chats[chat.id] = {
                        ...(state.chats[chat.id] || {}),
                        ...chat
                    }
                })
            })

            ev.on('chats.update', (updates) => {
                updates.forEach(update => {
                    if (state.chats[update.id]) {
                        Object.assign(state.chats[update.id], update)
                    }
                })
            })
            ev.on('messages.upsert', ({ messages }) => {
                messages.forEach(msg => {
                    const jid = msg.key.remoteJid
                    if (!jid) return

                    if (!state.messages[jid]) state.messages[jid] = []
                    
                    state.messages[jid].push(msg)

                    if (state.messages[jid].length > MAX_MESSAGES) {
                        state.messages[jid] = state.messages[jid].slice(-MAX_MESSAGES)
                    }
                })
            })
        },
        loadMessage: async (jid, id) => {
            if (!state.messages[jid]) return undefined
            const msg = state.messages[jid].find(m => m.key.id === id)
            return msg ? msg : undefined
        }
    }
}

export default makeStore;
