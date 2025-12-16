#### Add Your Own Plugins

Create plugins/mycommand.js:
js```
let handler = async (m, { conn, text }) => {
  await m.reply(`Hello! You said: ${text}`)
}

handler.help = ['mycommand']
handler.tags = ['general']
handler.command = ['mycommand', 'mc']

export default handler
```
Save and the bot will auto-reload it!
